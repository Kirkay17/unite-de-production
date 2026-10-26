/* Connexion par identifiant et mot de passe + base de données partagée (Firebase Firestore).
   Expose window.appDbReady : une promesse qui donne la base une fois l'utilisateur connecté,
   ou null si Firebase n'est pas configuré (mode local). */
(function(){
  const cfg = window.FIREBASE_CONFIG || {};
  if(!cfg.apiKey || !window.firebase){ window.appDbReady = Promise.resolve(null); return; }

  firebase.initializeApp(cfg);
  const auth = firebase.auth(), fs = firebase.firestore();
  // Garde une copie sur l'appareil : l'appli reste utilisable si la connexion coupe, et se synchronise au retour du réseau.
  fs.enablePersistence({ synchronizeTabs:true }).catch(() => {});

  /* Chaque document est rangé en JSON (champ j) : Firestore refuse les valeurs undefined et les tableaux
     imbriqués, le JSON accepte tout ce que l'appli enregistre. Le champ mois est recopié à part pour les requêtes. */
  const enc = d => { const o = { j:JSON.stringify(d) }; if(d && typeof d.mois === 'string') o.mois = d.mois; return o; };
  const dec = raw => raw && typeof raw.j === 'string' ? JSON.parse(raw.j) : (raw || {});
  const wrapDoc = s => ({ id:s.id, exists:s.exists, data:() => dec(s.data()) });
  const wrapQuery = q => ({ docs:q.docs.map(wrapDoc) });
  const query = ref => ({
    where:(f, op, v) => query(ref.where(f, op, v)),
    get:() => ref.get().then(wrapQuery),
    onSnapshot:(fn, err) => ref.onSnapshot(q => fn(wrapQuery(q)), err)
  });
  const db = {
    doc:path => { const ref = fs.doc(path); return {
      get:() => ref.get().then(wrapDoc),
      set:data => ref.set(enc(data)),
      delete:() => ref.delete()
    }; },
    collection:name => query(fs.collection(name))
  };

  /* ----- Identifiants -----
     Firebase identifie chaque compte par une adresse e-mail. Un identifiant simple (ex. « paul »)
     est transformé en paul@atelier.example.com : c'est cette adresse qu'on saisit en créant le compte dans la console. */
  const DOMAINE = '@atelier.example.com';
  const toEmail = id => { id = id.trim().toLowerCase(); return id.includes('@') ? id : id + DOMAINE; };
  const toId = email => String(email || '').replace(DOMAINE, '');
  const errMsg = e => {
    const c = e && e.code || '';
    if(/invalid-credential|wrong-password|user-not-found|invalid-email|invalid-login/.test(c)) return 'Identifiant ou mot de passe incorrect.';
    if(c === 'auth/too-many-requests') return 'Trop d\'essais. Attendez quelques minutes avant de réessayer.';
    if(c === 'auth/network-request-failed') return 'Pas de connexion internet. Vérifiez le réseau puis réessayez.';
    if(c === 'auth/weak-password') return 'Le mot de passe doit faire au moins 6 caractères.';
    if(c === 'auth/user-disabled') return 'Ce compte a été désactivé.';
    return 'Erreur : ' + (e && (e.message || e.code) || 'inconnue');
  };

  /* ----- Écran de connexion ----- */
  const gate = document.getElementById('authGate'), bar = document.getElementById('authBar'), tabs = document.getElementById('tabs');
  const $id = id => document.getElementById(id);
  const show = html => { gate.innerHTML = html; gate.hidden = false; tabs.hidden = true; $id('loading').hidden = true; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const loginScreen = () => {
    show(`<h2>Connexion</h2>
    <p class="desc">Saisissez votre identifiant et votre mot de passe pour accéder aux données partagées de l'atelier.</p>
    <form id="authForm" class="form v" novalidate style="max-width:560px">
      <label class="field" for="au-id"><span class="lab">Identifiant</span><span class="inp"><input type="text" id="au-id" autocomplete="username" autocapitalize="none" spellcheck="false"></span></label>
      <label class="field" for="au-pw"><span class="lab">Mot de passe</span><span class="inp"><input type="password" id="au-pw" autocomplete="current-password"></span></label>
      <button class="btn" type="submit">Se connecter</button>
    </form>
    <p class="formerr" id="au-err" role="alert"></p>`);
    $id('authForm').addEventListener('submit', e => {
      e.preventDefault();
      const id = $id('au-id').value, pw = $id('au-pw').value, err = $id('au-err');
      if(!id.trim() || !pw){ err.textContent = 'Saisissez votre identifiant et votre mot de passe.'; return; }
      err.textContent = '';
      auth.signInWithEmailAndPassword(toEmail(id), pw).catch(e => { err.textContent = errMsg(e); });
    });
    $id('au-id').focus();
  };
  const signOut = () => auth.signOut().then(() => location.reload());
  gate.addEventListener('click', e => { if(e.target.closest('#authOut')) signOut(); });

  /* ----- Barre du compte : déconnexion et changement de mot de passe ----- */
  const barHtml = user => `Connecté : <b>${esc(toId(user.email))}</b> ·
    <button type="button" class="linkbtn" id="pwOpen">Changer mon mot de passe</button> ·
    <button type="button" class="linkbtn" id="authOut">Se déconnecter</button>
    <span id="pwBox"></span>`;
  bar.addEventListener('click', e => {
    if(e.target.closest('#authOut')) signOut();
    if(e.target.closest('#pwCancel')) $id('pwBox').innerHTML = '';
    if(e.target.closest('#pwOpen')){
      $id('pwBox').innerHTML = `<form id="pwForm" class="form v card" novalidate style="margin-top:10px;max-width:720px">
        <label class="field" for="pw-old"><span class="lab">Mot de passe actuel</span><span class="inp"><input type="password" id="pw-old" autocomplete="current-password"></span></label>
        <label class="field" for="pw-new"><span class="lab">Nouveau mot de passe</span><span class="inp"><input type="password" id="pw-new" autocomplete="new-password" minlength="6"></span></label>
        <label class="field" for="pw-new2"><span class="lab">Confirmer</span><span class="inp"><input type="password" id="pw-new2" autocomplete="new-password"></span></label>
        <div class="bactions"><button class="btn" type="submit">Enregistrer</button><button type="button" class="ghost" id="pwCancel">Annuler</button></div>
        <p class="formerr" id="pw-err" role="alert" style="grid-column:1/-1"></p></form>`;
      $id('pw-old').focus();
    }
  });
  bar.addEventListener('submit', async e => {
    if(e.target.id !== 'pwForm') return;
    e.preventDefault();
    const oldPw = $id('pw-old').value, nw = $id('pw-new').value, nw2 = $id('pw-new2').value, err = $id('pw-err');
    if(!oldPw){ err.textContent = 'Saisissez votre mot de passe actuel.'; return; }
    if(nw.length < 6){ err.textContent = 'Le nouveau mot de passe doit faire au moins 6 caractères.'; return; }
    if(nw !== nw2){ err.textContent = 'Les deux nouveaux mots de passe ne sont pas identiques.'; return; }
    const user = auth.currentUser;
    try{
      await user.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(user.email, oldPw));
      await user.updatePassword(nw);
      $id('pwBox').innerHTML = ' <b style="color:var(--good)">Mot de passe modifié.</b>';
    }catch(ex){ err.textContent = errMsg(ex); }
  });

  window.appDbReady = new Promise(resolve => {
    let done = false;
    auth.onAuthStateChanged(async user => {
      if(done) return;
      if(!user){ loginScreen(); return; }
      try{ await fs.doc('app/courant').get(); }
      catch(e){
        if(e && e.code === 'permission-denied'){
          show(`<h2>Accès refusé</h2><p class="desc">Le compte <b>${esc(toId(user.email))}</b> n'a pas accès aux données. Demandez au responsable d'ajouter son code (UID) dans les règles de sécurité Firebase.</p>
            <div class="bactions"><button type="button" class="ghost" id="authOut">Changer de compte</button></div>`);
          return;
        }
      }
      done = true; gate.hidden = true; tabs.hidden = false; $id('loading').hidden = false;
      bar.innerHTML = barHtml(user); bar.hidden = false;
      resolve(db);
    });
  });
})();
