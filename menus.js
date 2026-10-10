'use strict';
// Idées de dîners qui changent chaque semaine, avec les recettes complètes dans l'application.
// Le menu est déterministe : la même semaine donne toujours les mêmes idées, et les idées des 2 semaines précédentes sont évitées.
// Il s'adapte au sport : repas riche en glucides la veille d'une sortie longue, repas protéiné les jours de renforcement.

const R = (id, nom, tags, temps, ingredients, etapes) => ({ id, nom, tags, temps, portions: 4, ingredients, etapes });
const CATALOGUE = [
  R('omelette', 'Omelette aux légumes et salade', ['rapide', 'veggie', 'famille'], 20, ['8 œufs', '2 courgettes', '1 oignon', '100 g de fromage râpé', 'Salade verte', 'Huile d’olive, sel, poivre'], 'Faites revenir l’oignon et les courgettes en dés 8 minutes. Battez les œufs, salez, poivrez, versez sur les légumes avec le fromage. Laissez prendre à feu doux 5 à 6 minutes, retournez ou passez sous le gril. Servez avec la salade.'),
  R('pates-tomate', 'Pâtes sauce tomate et basilic', ['rapide', 'veggie', 'glucides', 'famille'], 20, ['400 g de pâtes', '1 boîte de tomates concassées (400 g)', '1 oignon', '2 gousses d’ail', 'Basilic', 'Parmesan', 'Huile d’olive'], 'Faites suer l’oignon et l’ail dans l’huile, ajoutez les tomates et laissez mijoter 10 minutes. Cuisez les pâtes al dente. Mélangez avec la sauce, ajoutez le basilic et le parmesan.'),
  R('wok-poulet', 'Wok de poulet, légumes et riz', ['rapide', 'recup', 'famille'], 30, ['500 g de blanc de poulet', '300 g de riz', '1 poivron', '2 carottes', '1 courgette', '3 c. à soupe de sauce soja', 'Huile, gingembre'], 'Cuisez le riz. Coupez le poulet en lanières et les légumes en bâtonnets. Saisissez le poulet 5 minutes, réservez, puis les légumes 6 minutes. Remettez le poulet, ajoutez le soja et le gingembre, mélangez 2 minutes. Servez sur le riz.'),
  R('croque', 'Croque-monsieur et salade verte', ['rapide', 'famille'], 20, ['8 tranches de pain de mie', '4 tranches de jambon', '150 g de gruyère râpé', 'Béchamel ou beurre', 'Salade verte'], 'Garnissez 4 tranches de jambon et de fromage, recouvrez, nappez de béchamel ou de beurre et de fromage. Passez au four à 200 °C pendant 10 à 12 minutes, jusqu’à dorure. Servez avec la salade.'),
  R('quesadillas', 'Quesadillas poulet et maïs', ['rapide', 'famille'], 25, ['4 tortillas de blé', '250 g de poulet cuit', '1 boîte de maïs', '150 g de fromage râpé', '1 poivron', 'Crème fraîche'], 'Mélangez le poulet effiloché, le maïs et le poivron en dés. Posez le mélange et le fromage sur une moitié de tortilla, repliez. Faites dorer 2 à 3 minutes de chaque côté à la poêle. Servez avec la crème.'),
  R('saumon-patate', 'Saumon poêlé et purée de patate douce', ['recup', 'poisson', 'rapide'], 30, ['4 pavés de saumon', '800 g de patates douces', 'Citron', 'Haricots verts', 'Beurre, huile d’olive'], 'Cuisez les patates douces en cubes 15 minutes, écrasez avec un peu de beurre. Poêlez le saumon 4 minutes de chaque côté, citron et sel. Cuisez les haricots verts 8 minutes. Servez ensemble.'),
  R('tacos', 'Tacos maison', ['rapide', 'famille'], 30, ['8 tortillas', '500 g de bœuf haché ou de dinde', '1 boîte de haricots rouges', 'Tomates, salade, fromage râpé', 'Épices à tacos', 'Crème fraîche'], 'Faites revenir la viande avec les épices 8 minutes, ajoutez les haricots rouges. Réchauffez les tortillas. Garnissez de viande, de salade, de tomates, de fromage et d’un peu de crème.'),
  R('curry-pois-chiches', 'Curry de pois chiches et épinards', ['veggie', 'mijote', 'glucides'], 35, ['2 boîtes de pois chiches', '300 g d’épinards', '1 oignon', '1 boîte de tomates concassées', '20 cl de lait de coco', '2 c. à soupe de curry', '300 g de riz'], 'Faites revenir l’oignon avec le curry. Ajoutez tomates, lait de coco et pois chiches égouttés, mijotez 15 minutes. Ajoutez les épinards 3 minutes. Servez sur le riz.'),
  R('gratin-courgettes', 'Gratin de courgettes et ricotta', ['veggie', 'famille'], 50, ['1 kg de courgettes', '250 g de ricotta', '3 œufs', '100 g de parmesan', 'Ail, huile d’olive'], 'Coupez les courgettes en rondelles et faites-les revenir 8 minutes avec l’ail. Mélangez ricotta, œufs et la moitié du parmesan. Versez sur les courgettes dans un plat, parsemez de parmesan. Enfournez 30 minutes à 180 °C.'),
  R('lasagnes-legumes', 'Lasagnes aux légumes', ['veggie', 'famille', 'mijote', 'glucides'], 75, ['9 feuilles de lasagne', '2 courgettes', '2 aubergines', '700 g de sauce tomate', '250 g de mozzarella', 'Béchamel', 'Parmesan'], 'Faites revenir les légumes en dés 10 minutes. Dans un plat, alternez sauce, pâtes, légumes et béchamel. Terminez par mozzarella et parmesan. Enfournez 40 minutes à 180 °C.'),
  R('soupe-lentilles', 'Soupe de lentilles corail et pain grillé', ['veggie', 'rapide', 'recup'], 30, ['300 g de lentilles corail', '1 oignon', '2 carottes', '1 l de bouillon de légumes', 'Cumin', 'Pain complet', 'Yaourt nature'], 'Faites suer l’oignon et les carottes en dés. Ajoutez lentilles, bouillon et cumin, cuisez 20 minutes. Mixez. Servez avec une cuillère de yaourt et du pain grillé.'),
  R('galettes', 'Galettes de sarrasin complètes', ['veggie', 'famille'], 30, ['8 galettes de sarrasin', '8 œufs', '200 g de gruyère râpé', '4 tranches de jambon (facultatif)', 'Champignons', 'Beurre'], 'Réchauffez une galette à la poêle beurrée. Posez fromage, jambon ou champignons et un œuf au centre. Repliez les bords et cuisez 3 à 4 minutes à couvert, jusqu’à ce que le blanc soit pris.'),
  R('cabillaud-papillote', 'Cabillaud en papillote, citron et riz', ['poisson', 'recup'], 35, ['4 dos de cabillaud', '2 courgettes', '1 citron', '300 g de riz', 'Huile d’olive, aneth, sel, poivre'], 'Posez chaque dos de cabillaud sur une feuille de papier cuisson avec courgettes en rondelles, citron, huile et aneth. Fermez et enfournez 18 minutes à 200 °C. Cuisez le riz et servez.'),
  R('pates-thon', 'Pâtes au thon, tomates et olives', ['poisson', 'rapide', 'glucides'], 20, ['400 g de pâtes', '2 boîtes de thon au naturel', '300 g de tomates cerises', '80 g d’olives', 'Huile d’olive', 'Persil'], 'Cuisez les pâtes. Faites chauffer les tomates coupées dans l’huile 5 minutes. Ajoutez le thon émietté, les olives et les pâtes égouttées. Parsemez de persil.'),
  R('poisson-pane', 'Poisson pané maison et haricots verts', ['poisson', 'famille'], 30, ['4 filets de poisson blanc', '2 œufs', '100 g de chapelure', '2 c. à soupe de farine', 'Haricots verts', 'Pommes de terre', 'Citron'], 'Passez les filets dans la farine, l’œuf battu puis la chapelure. Faites-les dorer 3 à 4 minutes de chaque côté, ou 15 minutes au four à 200 °C. Servez avec les haricots verts et les pommes de terre vapeur.'),
  R('saumon-four', 'Saumon au four, riz et brocoli', ['poisson', 'recup', 'glucides'], 35, ['4 pavés de saumon', '1 brocoli', '300 g de riz', 'Sauce soja', 'Miel', 'Citron'], 'Badigeonnez le saumon d’un mélange de soja, miel et citron. Enfournez 12 à 15 minutes à 200 °C avec le brocoli en fleurettes. Servez avec le riz.'),
  R('poulet-roti', 'Poulet rôti et pommes de terre', ['famille', 'mijote'], 90, ['1 poulet fermier (1,5 kg)', '1 kg de pommes de terre', '1 tête d’ail', 'Thym, beurre, sel, poivre'], 'Frottez le poulet de beurre, sel, poivre et thym. Disposez les pommes de terre et l’ail autour. Enfournez 1 h 15 à 200 °C en arrosant de temps en temps. Laissez reposer 10 minutes avant de découper.'),
  R('boulettes', 'Boulettes de bœuf sauce tomate et semoule', ['famille', 'glucides'], 40, ['500 g de bœuf haché', '1 œuf', '3 c. à soupe de chapelure', '1 boîte de tomates concassées', '300 g de semoule', 'Oignon, persil'], 'Mélangez viande, œuf, chapelure, oignon haché et persil, façonnez des boulettes. Dorez-les 5 minutes, ajoutez les tomates et mijotez 15 minutes. Servez avec la semoule.'),
  R('gratin-pates', 'Gratin de pâtes jambon-fromage', ['famille', 'glucides'], 45, ['350 g de pâtes', '4 tranches de jambon', '200 g de gruyère râpé', '30 cl de crème', 'Lait, noix de muscade'], 'Cuisez les pâtes 2 minutes de moins que prévu. Mélangez avec le jambon en lanières, la crème, un peu de lait et la moitié du fromage. Versez dans un plat, couvrez de fromage et enfournez 20 minutes à 200 °C.'),
  R('hachis', 'Hachis parmentier', ['famille', 'mijote'], 70, ['500 g de bœuf haché', '1 kg de pommes de terre', '1 oignon', '20 cl de lait', 'Beurre', 'Fromage râpé'], 'Cuisez les pommes de terre et écrasez-les avec lait et beurre. Faites revenir l’oignon et la viande 8 minutes. Étalez la viande dans un plat, recouvrez de purée et de fromage. Enfournez 25 minutes à 200 °C.'),
  R('blanquette', 'Blanquette de dinde et riz', ['famille', 'mijote'], 60, ['700 g de dinde en morceaux', '300 g de champignons', '2 carottes', '1 oignon', '25 cl de crème', '300 g de riz', 'Bouillon, farine, citron'], 'Faites revenir la dinde, ajoutez oignon, carottes, farine puis le bouillon. Mijotez 35 minutes. Ajoutez les champignons, puis la crème et un filet de citron. Servez avec le riz.'),
  R('chili', 'Chili con carne et riz', ['mijote', 'glucides', 'recup', 'famille'], 55, ['500 g de bœuf haché', '1 boîte de haricots rouges', '1 boîte de tomates concassées', '1 oignon', '1 poivron', 'Épices (cumin, paprika)', '300 g de riz'], 'Faites revenir oignon, poivron et viande. Ajoutez épices, tomates et haricots rouges. Mijotez 30 minutes à feu doux. Servez avec le riz.'),
  R('pizza', 'Pizza maison jambon-champignons', ['famille', 'glucides'], 50, ['1 pâte à pizza', '200 g de sauce tomate', '150 g de mozzarella', '4 tranches de jambon', '200 g de champignons', 'Origan'], 'Étalez la pâte, nappez de sauce tomate. Ajoutez mozzarella, jambon et champignons émincés. Enfournez 15 minutes à 220 °C.'),
  R('riz-cantonais', 'Riz cantonais', ['rapide', 'famille', 'glucides'], 25, ['300 g de riz cuit refroidi', '3 œufs', '150 g de petits pois', '4 tranches de jambon', '2 c. à soupe de sauce soja', 'Huile'], 'Faites sauter le riz froid dans l’huile à feu vif. Poussez sur le côté, brouillez les œufs, mélangez. Ajoutez petits pois et jambon en dés, arrosez de soja et sautez 3 minutes.'),
  R('bowl-poulet', 'Bowl de poulet, quinoa et avocat', ['recup', 'rapide'], 25, ['400 g de blanc de poulet', '250 g de quinoa', '2 avocats', '1 concombre', 'Maïs', 'Citron, huile d’olive'], 'Cuisez le quinoa 12 minutes. Poêlez le poulet en lanières 6 à 7 minutes. Dressez dans des bols avec quinoa, poulet, avocat, concombre et maïs. Assaisonnez d’huile et de citron.'),
  R('steak-legumes', 'Steak haché maison, légumes rôtis et pommes de terre', ['recup', 'famille'], 45, ['500 g de bœuf haché', '1 œuf', '600 g de pommes de terre', '2 courgettes', '2 carottes', 'Huile d’olive, herbes'], 'Enfournez pommes de terre et légumes en morceaux avec huile et herbes 30 minutes à 200 °C. Mélangez la viande avec l’œuf, formez 4 steaks et poêlez 4 minutes de chaque côté.'),
  R('oeufs-avocat', 'Œufs brouillés, pain complet et avocat', ['rapide', 'veggie', 'recup'], 15, ['8 œufs', '4 tranches de pain complet', '2 avocats', 'Tomates cerises', 'Beurre, ciboulette'], 'Brouillez les œufs à feu doux dans un peu de beurre. Grillez le pain, écrasez l’avocat dessus, ajoutez les œufs, les tomates et la ciboulette.'),
  R('risotto', 'Risotto aux champignons et parmesan', ['glucides', 'veggie', 'mijote'], 40, ['300 g de riz à risotto', '400 g de champignons', '1 oignon', '1 l de bouillon chaud', '80 g de parmesan', 'Beurre, vin blanc (facultatif)'], 'Faites revenir l’oignon et les champignons. Ajoutez le riz, nacrez 2 minutes. Versez le bouillon louche par louche en remuant, 18 minutes environ. Terminez avec beurre et parmesan.'),
  R('bolognaise', 'Spaghetti bolognaise', ['glucides', 'famille', 'mijote'], 50, ['400 g de spaghetti', '500 g de bœuf haché', '1 boîte de tomates concassées', '1 oignon', '1 carotte', 'Ail, herbes', 'Parmesan'], 'Faites revenir oignon, carotte et ail, ajoutez la viande, puis les tomates et les herbes. Mijotez 30 minutes. Cuisez les spaghetti et servez avec le parmesan.'),
  R('gnocchis', 'Gnocchis poêlés, tomates et mozzarella', ['glucides', 'rapide', 'veggie'], 20, ['600 g de gnocchis', '300 g de tomates cerises', '2 boules de mozzarella', 'Basilic', 'Huile d’olive'], 'Faites dorer les gnocchis à la poêle avec l’huile 6 à 8 minutes. Ajoutez les tomates 3 minutes, puis la mozzarella en morceaux et le basilic hors du feu.'),
  R('roti-lentilles', 'Rôti de porc et lentilles', ['mijote', 'famille', 'recup'], 80, ['800 g de rôti de porc', '300 g de lentilles vertes', '2 carottes', '1 oignon', 'Thym, moutarde'], 'Badigeonnez le rôti de moutarde et enfournez 55 minutes à 180 °C. Cuisez les lentilles avec carottes, oignon et thym 25 minutes. Tranchez le rôti et servez sur les lentilles.'),
  R('tajine', 'Tajine de poulet aux abricots secs et semoule', ['mijote', 'glucides', 'famille'], 70, ['4 cuisses de poulet', '100 g d’abricots secs', '2 oignons', '2 carottes', 'Épices (cumin, cannelle, paprika)', '300 g de semoule', 'Amandes'], 'Faites dorer le poulet, ajoutez oignons, carottes et épices, couvrez d’eau à mi-hauteur. Mijotez 40 minutes, ajoutez les abricots 10 minutes. Servez avec la semoule et des amandes.'),
];
const CAT_PAR_ID = Object.fromEntries(CATALOGUE.map(r => [r.id, r]));

// Générateur pseudo-aléatoire déterministe
const graine = s => { let h = 7; for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0; return h; };
const alea = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const BASE_JOURS = ['rapide', 'veggie', 'famille', 'poisson', 'famille', 'glucides', 'mijote'];
const TAG_NOM = { rapide: 'Rapide', veggie: 'Végétarien', famille: 'Famille', poisson: 'Poisson', glucides: 'Énergie', mijote: 'Mijoté', recup: 'Récupération' };

// Besoins sportifs d'un jour : glucides la veille d'une séance longue, protéines un jour de renforcement
function besoinSport(date) {
  if (typeof membresSport !== 'function') return null;
  const demain = iso(ajouteJours(parse(date), 1));
  for (const m of membresSport()) {
    if (contexteJour(m.id, demain).type === 'long' && contexteJour(m.id, demain).prevue) return { tag: 'glucides', raison: `Veille de séance longue (${m.nom}) : repas riche en glucides` };
  }
  for (const m of membresSport()) {
    const l = prevuesLe(m.id, date);
    if (l.some(x => x.type === 'muscu')) return { tag: 'recup', raison: `Après le renforcement (${m.nom}) : repas riche en protéines` };
  }
  return null;
}
function menuSemaine(lun, prof = 2) {
  const prec1 = new Set(), prec2 = new Set();
  if (prof > 0) for (let k = 1; k <= 2; k++) menuSemaine(iso(ajouteJours(parse(lun), -7 * k)), prof - 1).forEach(x => (k === 1 ? prec1 : prec2).add(x.r.id));
  const hasard = alea(graine(lun)), utilises = new Set(), out = [];
  for (let i = 0; i < 7; i++) {
    const date = iso(ajouteJours(parse(lun), i)), sp = besoinSport(date), tag = sp ? sp.tag : BASE_JOURS[i];
    const filtres = [r => !utilises.has(r.id) && !prec1.has(r.id) && !prec2.has(r.id), r => !utilises.has(r.id) && !prec1.has(r.id), r => !utilises.has(r.id)];
    let c = [];
    for (const f of filtres) { c = CATALOGUE.filter(r => r.tags.includes(tag) && f(r)); if (c.length) break; }
    if (!c.length) c = CATALOGUE.filter(filtres[2]);
    const decal = (etat.menuAlt || {})[`${lun}:${i}`] || 0;
    const r = c[(Math.floor(hasard() * c.length) + decal) % c.length];
    utilises.add(r.id);
    out.push({ date, r, tag, raison: sp ? sp.raison : '' });
  }
  return out;
}
// Ajoute la recette du catalogue à « Mes recettes » (nécessaire pour envoyer les ingrédients aux courses)
function enregistrerRecette(r) {
  let x = etat.recettes.find(y => cle(y.nom) === cle(r.nom));
  if (!x) { x = { id: uid(), nom: r.nom, portions: r.portions, ingredients: [...r.ingredients], etapes: r.etapes, fav: false }; etat.recettes.push(x); }
  return x;
}

// ---------- Interface ----------
function ideesRepas() {
  const lun = iso(semaineAff), menu = menuSemaine(lun);
  return `<section class="carte"><h2>Idées de la semaine</h2>
    <p class="mut">Sept dîners qui changent chaque semaine, avec la recette complète. Ils tiennent compte de votre sport et évitent les plats des deux semaines précédentes.</p>
    <ul class="liste">${menu.map((x, i) => `<li><button class="rang" data-act="ouvrir" data-sheet="idee" data-id="${x.r.id}" data-date="${x.date}" data-i="${i}" data-lun="${lun}">
      <span class="heure" style="flex-basis:46px">${JOURS[i]}</span>
      <span class="rang-txt"><b>${esc(x.r.nom)}</b><small>${x.r.temps} min · ${x.r.tags.slice(0, 2).map(t => TAG_NOM[t] || t).join(', ')}${x.raison ? ' · ' + esc(x.raison) : ''}</small></span>
      ${etat.repas[x.date] && etat.repas[x.date].soir === x.r.nom ? '<span class="pill ok">Planifié</span>' : ''}</button></li>`).join('')}</ul>
    <div class="rangee"><button class="btn" data-act="idees-plan">Planifier les dîners libres</button><button class="btn sec" data-act="idees-courses">Ajouter tous les ingrédients aux courses</button></div></section>`;
}
SHEETS.idee = d => {
  const r = CAT_PAR_ID[d.id];
  if (!r) return { titre: 'Recette', corps: '<p>Recette introuvable.</p>' };
  const plan = etat.repas[d.date] && etat.repas[d.date].soir === r.nom;
  return { titre: r.nom, corps: `<p class="mut">${r.portions} portions · ${r.temps} min${d.date ? ' · ' + fmtLong(d.date) : ''}</p>
    <h3 class="mut" style="margin:0;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em">Ingrédients</h3>
    <ul class="liste">${r.ingredients.map(i => `<li class="rang" style="min-height:38px"><span class="rang-txt">${esc(i)}</span></li>`).join('')}</ul>
    <h3 class="mut" style="margin:0;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em">Préparation</h3><p style="color:var(--ink)">${esc(r.etapes)}</p>
    <small>Quantités pour 4 personnes : ajustez selon l’appétit. Pour un bébé, adaptez textures et aliments à son âge, avec l’avis du pédiatre.</small>
    <div class="rangee">${d.date ? `<button class="btn"${plan ? ' disabled' : ''} data-act="idee-plan" data-id="${r.id}" data-date="${d.date}">${plan ? 'Déjà planifié' : 'Planifier ce soir-là'}</button>` : ''}<button class="btn sec" data-act="idee-courses" data-id="${r.id}">Ajouter aux courses</button></div>
    <div class="rangee"><button class="btn sec" data-act="idee-save" data-id="${r.id}">Ajouter à mes recettes</button>${d.date ? `<button class="btn sec" data-act="idee-alt" data-lun="${d.lun}" data-i="${d.i}">Proposer autre chose</button>` : ''}</div>` };
};
ACTIONS['idee-plan'] = el => {
  const r = CAT_PAR_ID[el.dataset.id];
  enregistrerRecette(r);
  etat.repas[el.dataset.date] = { ...etat.repas[el.dataset.date], soir: r.nom };
  fermerFeuille();
  info(`« ${r.nom} » planifié le ${fmtDate(el.dataset.date)}.`);
};
ACTIONS['idee-save'] = el => { enregistrerRecette(CAT_PAR_ID[el.dataset.id]); fermerFeuille(); info('Ajoutée à vos recettes.'); };
ACTIONS['idee-courses'] = el => { const r = CAT_PAR_ID[el.dataset.id]; r.ingredients.forEach(i => ajouterCourse(i, 1)); fermerFeuille(); info(`${r.ingredients.length} ingrédients ajoutés aux courses.`); };
ACTIONS['idee-alt'] = el => { etat.menuAlt = etat.menuAlt || {}; const k = `${el.dataset.lun}:${el.dataset.i}`; etat.menuAlt[k] = (etat.menuAlt[k] || 0) + 1; fermerFeuille(); info('Nouvelle idée proposée.'); };
ACTIONS['idees-plan'] = () => {
  const menu = menuSemaine(iso(semaineAff)); let n = 0;
  menu.forEach(x => { const e = etat.repas[x.date] || {}; if (!e.soir) { enregistrerRecette(x.r); etat.repas[x.date] = { ...e, soir: x.r.nom }; n++; } });
  info(n ? `${n} dîner${pl(n)} planifié${pl(n)}.` : 'Tous les dîners sont déjà planifiés.');
};
ACTIONS['idees-courses'] = () => {
  const menu = menuSemaine(iso(semaineAff)); let n = 0;
  menu.forEach(x => x.r.ingredients.forEach(i => { if (!etat.courses.some(c => !c.fait && cle(c.nom) === cle(i))) { ajouterCourse(i, 1); n++; } }));
  info(`${n} ingrédient${pl(n)} ajouté${pl(n)} aux courses.`);
};
