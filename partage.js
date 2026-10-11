// ---------- Partage d'un rendez-vous : invités par e-mail, Google Agenda, brouillon Gmail avec fichier .ics ----------
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/;
const parseEmails = txt => [...new Set(String(txt || '').split(/[,;\s]+/).map(x => x.trim().toLowerCase()).filter(x => EMAIL_RE.test(x)))];
function contactsProposes() {
  const vus = new Set(), l = [];
  etat.membres.filter(m => m.email).forEach(m => { const a = m.email.toLowerCase(); if (!vus.has(a)) { vus.add(a); l.push({ email: a, nom: m.nom }); } });
  (etat.contacts || []).forEach(a => { if (!vus.has(a)) { vus.add(a); l.push({ email: a, nom: '' }); } });
  return l;
}
function champInvites(e) {
  const val = (e && e.invites || []).join(', '), L = contactsProposes();
  return `<div class="champ"><span>Partager avec (adresses e-mail)</span>
    <input name="invites" type="text" inputmode="email" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(val)}" placeholder="justine@exemple.fr, ami@exemple.fr" aria-label="Adresses e-mail des invités">
    ${L.length ? `<div class="chips" role="group" aria-label="Contacts">${L.map(c => `<button type="button" data-act="inv-ajout" data-v="${esc(c.email)}">${esc(c.nom || c.email)}</button>`).join('')}</div>` : ''}
    <small>Séparez les adresses par une virgule. Elles sont mémorisées pour la prochaine fois.</small></div>`;
}
ACTIONS['inv-ajout'] = el => {
  const f = el.closest('form'), c = f && f.elements.invites; if (!c) return false;
  const l = parseEmails(c.value), a = el.dataset.v, i = l.indexOf(a);
  if (i >= 0) l.splice(i, 1); else l.push(a);
  c.value = l.join(', ');
  return false;
};
function rememberContacts(l) { etat.contacts = [...new Set([...(etat.contacts || []), ...l])].slice(0, 60); }

// --- dates ---
const p2 = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`;
function bornes(e) {
  if (!e.heure) { const d = parse(e.date); return { tout: true, a: ymd(d), b: ymd(ajouteJours(d, 1)) }; }
  const [h, m] = e.heure.split(':').map(Number), d = parse(e.date), debut = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m), fin = new Date(debut.getTime() + (Number(e.duree) || 60) * 60000);
  const f = x => `${ymd(x)}T${p2(x.getHours())}${p2(x.getMinutes())}00`;
  return { tout: false, a: f(debut), b: f(fin) };
}
const RRULES = { jour: 'FREQ=DAILY', semaine: 'FREQ=WEEKLY', quinzaine: 'FREQ=WEEKLY;INTERVAL=2', mois: 'FREQ=MONTHLY', an: 'FREQ=YEARLY' };
const detailsEvent = e => [e.lieu ? 'Lieu : ' + e.lieu : '', e.membre && membre(e.membre) ? 'Pour : ' + membre(e.membre).nom : ''].filter(Boolean).join('\n');
function lienAgenda(e) {
  const b = bornes(e), q = new URLSearchParams({ action: 'TEMPLATE', text: e.titre, dates: b.a + '/' + b.b, details: detailsEvent(e), location: e.lieu || '' });
  if (e.invites && e.invites.length) q.set('add', e.invites.join(','));
  if (RRULES[e.rec]) q.set('recur', 'RRULE:' + RRULES[e.rec]);
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}
const icsTxt = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const plier = l => l.length <= 74 ? l : l.match(/.{1,73}/g).join('\r\n ');
function icsEvent(e) {
  const b = bornes(e), n = new Date(), stamp = `${n.getUTCFullYear()}${p2(n.getUTCMonth() + 1)}${p2(n.getUTCDate())}T${p2(n.getUTCHours())}${p2(n.getUTCMinutes())}${p2(n.getUTCSeconds())}Z`;
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//App Famille//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT', `UID:${e.id}@app-famille`, `DTSTAMP:${stamp}`,
    b.tout ? `DTSTART;VALUE=DATE:${b.a}` : `DTSTART:${b.a}`, b.tout ? `DTEND;VALUE=DATE:${b.b}` : `DTEND:${b.b}`, `SUMMARY:${icsTxt(e.titre)}`];
  if (e.lieu) L.push(`LOCATION:${icsTxt(e.lieu)}`);
  if (detailsEvent(e)) L.push(`DESCRIPTION:${icsTxt(detailsEvent(e))}`);
  if (RRULES[e.rec]) L.push('RRULE:' + RRULES[e.rec]);
  (e.invites || []).forEach(a => L.push(`ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:${a}`));
  L.push('END:VEVENT', 'END:VCALENDAR');
  return L.map(plier).join('\r\n') + '\r\n';
}
const corpsInvitation = e => `Bonjour,\n\nJe vous invite : ${e.titre}\nLe ${fmtLong(e.date)}${e.heure ? ' à ' + e.heure : ''}${e.lieu ? '\nLieu : ' + e.lieu : ''}${e.rec ? '\nRépétition : ' + REC_NOMS[e.rec].toLowerCase() : ''}\n\nL'invitation est jointe (fichier .ics) : ouvrez-la pour l'ajouter à votre agenda.\n`;
const ERR_MAIL = { server_not_connected: 'Gmail n’est pas connecté : ajoutez-le dans claude.ai, Réglages, Connecteurs, ou utilisez le lien Google Agenda.', needs_reauth: 'Reconnectez Gmail dans claude.ai, Réglages, Connecteurs.', not_granted: 'Accès à Gmail refusé : autorisez-le pour créer le brouillon.', approval_required: 'Autorisez l’accès à Gmail pour créer le brouillon.', blocked_by_policy: 'Accès à Gmail bloqué par votre organisation.', tool_error: 'Gmail a refusé la création du brouillon.' };
function blocPartage(e) {
  const inv = e.invites || [];
  if (!inv.length) return '<small>Ajoutez des adresses e-mail ci-dessus, puis enregistrez : vous pourrez alors envoyer l’invitation.</small>';
  const mail = `mailto:${inv.join(',')}?subject=${encodeURIComponent('Invitation : ' + e.titre)}&body=${encodeURIComponent(corpsInvitation(e).replace('L\'invitation est jointe (fichier .ics) : ouvrez-la pour l\'ajouter à votre agenda.\n', ''))}`;
  return `<div class="partage"><b>Inviter ${inv.length} personne${pl(inv.length)}</b>
    <a class="btn" target="_blank" rel="noopener" href="${esc(lienAgenda(e))}">Ajouter à Google Agenda et inviter ↗</a>
    <small>Google Agenda s’ouvre avec le rendez-vous et les invités : enregistrez-le pour envoyer les invitations.</small>
    ${window.__NATIVE ? `<a class="btn sec" href="${esc(mail)}">Écrire un e-mail</a>` : `<button type="button" class="btn sec" data-act="inv-brouillon" data-id="${e.id}">Créer un brouillon Gmail avec le fichier .ics</button>`}
    <p class="mut" id="invRes" role="status"></p></div>`;
}
ACTIONS['inv-brouillon'] = async el => {
  const e = etat.events.find(x => x.id === el.dataset.id), res = document.getElementById('invRes');
  if (!e || !e.invites || !e.invites.length) return false;
  const dire = t => { if (res) res.innerHTML = t; };
  let mcp = null;
  try { mcp = window.claude && window.claude.use ? await window.claude.use('mcp') : null; } catch { mcp = null; }
  if (!mcp) { dire('Brouillon indisponible ici : utilisez le lien Google Agenda.'); return false; }
  dire('Création du brouillon…');
  try {
    const b64 = btoa(unescape(encodeURIComponent(icsEvent(e))));
    const r = await mcp.callTool('Gmail', 'create_draft', { to: e.invites, subject: `Invitation : ${e.titre}`, body: corpsInvitation(e), attachments: [{ content: b64, filename: 'invitation.ics', mimeType: 'text/calendar' }] }, { cache: false });
    const p = r && r.payload, url = p && (p.viewUrl || (p.draft && p.draft.viewUrl));
    dire(`Brouillon créé dans Gmail : relisez-le puis envoyez-le.${url && /^https:\/\/mail\.google\.com\//.test(url) ? ` <a href="${esc(url)}" target="_blank" rel="noopener">Ouvrir le brouillon ↗</a>` : ''}`);
  } catch (err) { dire(esc(ERR_MAIL[err && err.code] || 'Impossible de créer le brouillon. Utilisez le lien Google Agenda.')); }
  return false;
};
