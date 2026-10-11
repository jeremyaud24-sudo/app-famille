'use strict';
// Idées de dîners qui changent chaque semaine, avec les recettes complètes dans l'application.
// Le menu est déterministe : la même semaine donne toujours les mêmes idées, et les idées des 2 semaines précédentes sont évitées.
// Il s'adapte au sport : repas riche en glucides la veille d'une sortie longue, repas protéiné les jours de renforcement.

const R = (id, nom, tags, temps, ingredients, etapes, moment = 'soir') => ({ id, nom, tags, temps, portions: 4, ingredients, etapes, m: moment });
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
  // Déjeuners (midi) : plus légers et plus rapides
  R('salade-quinoa', 'Salade de quinoa, feta et concombre', ['veggie', 'recup', 'rapide'], 20, ['250 g de quinoa', '200 g de feta', '1 concombre', '300 g de tomates', '80 g d’olives', 'Menthe, citron, huile d’olive'], 'Cuisez le quinoa 12 minutes, égouttez et laissez tiédir. Coupez concombre, tomates et feta en dés. Mélangez avec les olives, la menthe, le jus de citron et l’huile.', 'midi'),
  R('salade-nicoise', 'Salade niçoise', ['poisson', 'recup'], 25, ['2 boîtes de thon au naturel', '4 œufs', '300 g de haricots verts', '400 g de tomates', '400 g de pommes de terre', '80 g d’olives', 'Huile d’olive, vinaigre'], 'Cuisez œufs durs, pommes de terre et haricots verts. Coupez tomates et pommes de terre. Dressez avec le thon émietté, les œufs en quartiers et les olives, assaisonnez d’huile et de vinaigre.', 'midi'),
  R('salade-pates-poulet', 'Salade de pâtes au poulet', ['glucides', 'rapide', 'famille'], 20, ['300 g de pâtes', '300 g de blanc de poulet cuit', '1 poivron', '1 boîte de maïs', 'Mayonnaise légère ou yaourt', 'Ciboulette'], 'Cuisez et refroidissez les pâtes. Mélangez avec le poulet en dés, le poivron, le maïs, la sauce et la ciboulette.', 'midi'),
  R('wrap-thon', 'Wraps au thon et crudités', ['poisson', 'rapide', 'famille'], 15, ['4 tortillas', '2 boîtes de thon', '1 avocat ou fromage frais', 'Salade, tomates, concombre', 'Citron'], 'Mélangez le thon avec l’avocat écrasé ou le fromage frais et un filet de citron. Garnissez les tortillas avec la salade et les crudités, roulez serré.', 'midi'),
  R('sandwich-poulet', 'Sandwich poulet-avocat', ['recup', 'rapide'], 10, ['4 petits pains complets', '300 g de poulet cuit', '2 avocats', 'Tomates, salade', 'Citron, sel, poivre'], 'Écrasez l’avocat avec le citron, tartinez les pains, ajoutez poulet effiloché, tomates et salade.', 'midi'),
  R('taboule', 'Taboulé frais aux herbes', ['veggie', 'rapide', 'glucides'], 20, ['250 g de semoule', '4 tomates', '1 concombre', '1 bouquet de persil', 'Menthe, citron, huile d’olive'], 'Hydratez la semoule à l’eau chaude 5 minutes, égrenez. Ajoutez tomates et concombre en petits dés, persil et menthe ciselés, citron et huile. Laissez reposer 30 minutes au frais.', 'midi'),
  R('veloute-potiron', 'Velouté de potiron et croûtons', ['veggie', 'mijote'], 35, ['1 kg de potiron', '1 oignon', '1 l de bouillon', '10 cl de crème', 'Pain pour croûtons', 'Noix de muscade'], 'Faites revenir l’oignon, ajoutez le potiron en cubes et le bouillon, cuisez 25 minutes. Mixez avec la crème et la muscade. Servez avec des croûtons.', 'midi'),
  R('quiche-lorraine', 'Quiche lorraine', ['famille', 'mijote'], 55, ['1 pâte brisée', '200 g de lardons', '3 œufs', '20 cl de crème', '10 cl de lait', '100 g de gruyère râpé'], 'Foncez un moule avec la pâte. Faites dorer les lardons, répartissez-les. Battez œufs, crème, lait, fromage, versez. Enfournez 35 minutes à 180 °C. Servez avec une salade.', 'midi'),
  R('quiche-legumes', 'Quiche aux légumes et chèvre', ['veggie', 'famille'], 55, ['1 pâte brisée', '2 courgettes', '1 poivron', '1 bûche de chèvre', '3 œufs', '20 cl de crème'], 'Faites revenir les légumes 8 minutes. Étalez sur la pâte, ajoutez le chèvre en rondelles. Versez œufs battus et crème. Enfournez 35 minutes à 180 °C.', 'midi'),
  R('salade-lentilles', 'Salade de lentilles et œuf mimosa', ['veggie', 'recup', 'mijote'], 35, ['250 g de lentilles vertes', '2 carottes', '1 échalote', '4 œufs', 'Moutarde, vinaigre, huile', 'Persil'], 'Cuisez les lentilles 25 minutes avec une carotte. Mélangez à la vinaigrette, à l’échalote et à la carotte crue râpée. Ajoutez les œufs durs écrasés et le persil.', 'midi'),
  R('tortilla', 'Tortilla de pommes de terre', ['veggie', 'famille', 'glucides'], 40, ['600 g de pommes de terre', '1 oignon', '6 œufs', 'Huile d’olive', 'Sel, poivre', 'Salade verte'], 'Faites cuire pommes de terre et oignon en lamelles dans l’huile 15 minutes. Mélangez aux œufs battus. Cuisez 6 minutes à la poêle, retournez avec une assiette, 4 minutes de plus.', 'midi'),
  R('salade-cesar', 'Salade César au poulet', ['rapide', 'recup', 'famille'], 25, ['400 g de blanc de poulet', '2 cœurs de salade romaine', '50 g de parmesan', 'Croûtons', 'Sauce césar'], 'Poêlez le poulet en lamelles 6 minutes. Dressez la salade avec croûtons et copeaux de parmesan, ajoutez le poulet et la sauce.', 'midi'),
  R('poke-saumon', 'Poke bowl au saumon', ['poisson', 'recup', 'glucides'], 30, ['300 g de riz à sushi', '300 g de saumon frais', '2 avocats', '1 concombre', 'Edamame ou maïs', 'Sauce soja, citron vert'], 'Cuisez le riz. Coupez le saumon en dés et marinez 10 minutes dans soja et citron. Dressez le riz, le saumon, l’avocat, le concombre et l’edamame.', 'midi'),
  R('salade-grecque', 'Salade grecque et pain pita', ['veggie', 'rapide'], 15, ['4 tomates', '1 concombre', '200 g de feta', '1 oignon rouge', '80 g d’olives', 'Origan, huile d’olive', '4 pains pita'], 'Coupez les légumes en gros dés, ajoutez olives et feta en cubes, origan et huile. Servez avec les pitas réchauffés.', 'midi'),
  R('couscous-froid', 'Couscous froid aux légumes', ['veggie', 'glucides', 'rapide'], 25, ['300 g de semoule', '1 poivron', '1 courgette', '1 boîte de pois chiches', 'Raisins secs', 'Citron, huile, cumin'], 'Hydratez la semoule à l’eau chaude, égrenez. Ajoutez légumes crus en dés, pois chiches, raisins, citron, huile et cumin. Servez frais.', 'midi'),
  R('soupe-minestrone', 'Minestrone et parmesan', ['veggie', 'mijote', 'glucides'], 45, ['2 carottes', '2 courgettes', '1 boîte de haricots blancs', '100 g de petites pâtes', '400 g de tomates concassées', '1 l de bouillon', 'Parmesan, basilic'], 'Faites revenir les légumes en dés, ajoutez tomates et bouillon, cuisez 20 minutes. Ajoutez haricots et pâtes 10 minutes. Servez avec parmesan et basilic.', 'midi'),
  R('club-sandwich', 'Club sandwich maison', ['rapide', 'famille'], 15, ['12 tranches de pain de mie', '4 tranches de jambon', '4 œufs', 'Tomates, salade', 'Fromage frais ou mayonnaise'], 'Cuisez les œufs au plat ou durs. Toastez le pain, tartinez, empilez jambon, œuf, tomate et salade sur 3 étages. Coupez en triangles.', 'midi'),
  R('riz-thon', 'Salade de riz, thon et maïs', ['poisson', 'rapide', 'glucides'], 20, ['300 g de riz', '2 boîtes de thon', '1 boîte de maïs', '3 tomates', 'Olives', 'Vinaigrette'], 'Cuisez et refroidissez le riz. Mélangez avec thon, maïs, tomates, olives et vinaigrette.', 'midi'),
  R('pita-poulet', 'Pita poulet, yaourt et concombre', ['rapide', 'recup'], 20, ['4 pains pita', '400 g de blanc de poulet', '2 yaourts nature', '1 concombre', 'Ail, citron, paprika'], 'Poêlez le poulet épicé au paprika. Mélangez yaourt, concombre râpé, ail et citron. Garnissez les pitas de poulet et de sauce.', 'midi'),
];
const CAT_PAR_ID = Object.fromEntries(CATALOGUE.map(r => [r.id, r]));
['omelette', 'croque', 'pates-tomate', 'pates-thon', 'soupe-lentilles', 'oeufs-avocat', 'bowl-poulet', 'gnocchis', 'riz-cantonais', 'quesadillas', 'galettes'].forEach(id => { CAT_PAR_ID[id].m = 'tous'; });

// Générateur pseudo-aléatoire déterministe
const graine = s => { let h = 7; for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0; return h; };
const alea = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const BASE_SOIR = ['rapide', 'veggie', 'famille', 'poisson', 'famille', 'glucides', 'mijote'];
const BASE_MIDI = ['rapide', 'veggie', 'rapide', 'poisson', 'rapide', 'famille', 'mijote'];
const TAG_NOM = { rapide: 'Rapide', veggie: 'Végétarien', famille: 'Famille', poisson: 'Poisson', glucides: 'Énergie', mijote: 'Mijoté', recup: 'Récupération' };
const MOMENTS = [['midi', 'Midi'], ['soir', 'Soir']];

// Besoins sportifs : glucides la veille d'une séance longue (dîner), protéines après un renforcement (dîner) ou une séance longue (déjeuner)
function besoinSport(date, moment) {
  if (typeof membresSport !== 'function') return null;
  if (moment === 'midi') {
    for (const m of membresSport()) { const c = contexteJour(m.id, date); if (c.type === 'long' && c.prevue) return { tag: 'recup', raison: `Après la séance longue (${m.nom}) : repas riche en protéines` }; }
    return null;
  }
  const demain = iso(ajouteJours(parse(date), 1));
  for (const m of membresSport()) {
    const c = contexteJour(m.id, demain);
    if (c.type === 'long' && c.prevue) return { tag: 'glucides', raison: `Veille de séance longue (${m.nom}) : repas riche en glucides` };
  }
  for (const m of membresSport()) {
    if (prevuesLe(m.id, date).some(x => x.type === 'muscu')) return { tag: 'recup', raison: `Après le renforcement (${m.nom}) : repas riche en protéines` };
  }
  return null;
}
const cleSlot = (lun, i, m = 'soir') => (m === 'soir' ? `${lun}:${i}` : `${lun}:${i}:${m}`);
// Menu de la semaine : 14 repas (midi et soir), tous différents, sans les plats refusés ni ceux des deux semaines précédentes
function menuSemaine(lun, prof = 2) {
  const prec1 = new Set(), prec2 = new Set(), refus = new Set((etat.menuRefus || []).filter(x => Math.abs(diffJours(x.date, lun)) <= 56).map(x => x.id));
  if (prof > 0) for (let k = 1; k <= 2; k++) menuSemaine(iso(ajouteJours(parse(lun), -7 * k)), prof - 1).forEach(x => (k === 1 ? prec1 : prec2).add(x.r.id));
  const hasard = alea(graine(lun)), utilises = new Set(), out = [];
  for (let i = 0; i < 7; i++) {
    for (const [moment] of MOMENTS) {
      const date = iso(ajouteJours(parse(lun), i)), sp = besoinSport(date, moment), tag = sp ? sp.tag : (moment === 'midi' ? BASE_MIDI : BASE_SOIR)[i];
      const ok = r => r.m === 'tous' || r.m === moment;
      const filtres = [r => !utilises.has(r.id) && !refus.has(r.id) && !prec1.has(r.id) && !prec2.has(r.id), r => !utilises.has(r.id) && !refus.has(r.id) && !prec1.has(r.id), r => !utilises.has(r.id) && !refus.has(r.id), r => !utilises.has(r.id)];
      let c = [];
      for (const f of filtres) { c = CATALOGUE.filter(r => ok(r) && r.tags.includes(tag) && f(r)); if (c.length) break; }
      if (!c.length) for (const f of filtres) { c = CATALOGUE.filter(r => ok(r) && f(r)); if (c.length) break; }
      const decal = (etat.menuAlt || {})[cleSlot(lun, i, moment)] || 0;
      const r = c[(Math.floor(hasard() * c.length) + decal) % c.length];
      utilises.add(r.id);
      out.push({ date, i, moment, r, tag, raison: sp ? sp.raison : '' });
    }
  }
  return out;
}
// Ajoute la recette du catalogue à « Mes recettes » (nécessaire pour envoyer les ingrédients aux courses)
function enregistrerRecette(r) {
  let x = etat.recettes.find(y => cle(y.nom) === cle(r.nom));
  if (!x) { x = { id: uid(), nom: r.nom, portions: r.portions, ingredients: [...r.ingredients], etapes: r.etapes, fav: false }; etat.recettes.push(x); }
  return x;
}

// ---------- Validation : un repas validé est planifié et ses ingrédients passent dans la liste de courses ----------
const valideDe = (lun, i, m = 'soir') => (etat.menuVal || []).find(x => x.id === cleSlot(lun, i, m));
function validerRepas(lun, i, m, r, date) {
  if (valideDe(lun, i, m)) return 0;
  const ajouts = r.ingredients.map(ing => { const d = ajouterCourseDetail(ing, 1, r.nom); return { id: d.id, nouveau: d.etat === 'new' }; });
  enregistrerRecette(r);
  etat.repas[date] = { ...etat.repas[date], [m]: r.nom };
  (etat.menuVal = etat.menuVal || []).push({ id: cleSlot(lun, i, m), rid: r.id, date, m, ajouts });
  return r.ingredients.length;
}
function annulerRepas(lun, i, m = 'soir') {
  const v = valideDe(lun, i, m);
  if (!v) return;
  v.ajouts.forEach(a => {
    const c = etat.courses.find(x => x.id === a.id);
    if (!c || c.fait) return;
    if (a.nouveau) etat.courses = etat.courses.filter(x => x.id !== a.id); else if ((c.qte || 1) > 1) c.qte--;
  });
  const r = CAT_PAR_ID[v.rid], mm = v.m || 'soir';
  if (r && etat.repas[v.date] && etat.repas[v.date][mm] === r.nom) etat.repas[v.date] = { ...etat.repas[v.date], [mm]: '' };
  etat.menuVal = etat.menuVal.filter(x => x !== v);
}
// Invalider : annule la validation éventuelle, écarte la recette pour plusieurs semaines et propose autre chose
function invaliderRepas(lun, i, m, rid) {
  annulerRepas(lun, i, m);
  (etat.menuRefus = etat.menuRefus || []).push({ id: rid, date: lun });
  etat.menuRefus = etat.menuRefus.filter(x => diffJours(x.date, aujourdhui()) > -120).slice(-60);
  etat.menuAlt = etat.menuAlt || {};
  const k = cleSlot(lun, i, m);
  etat.menuAlt[k] = (etat.menuAlt[k] || 0) + 1;
}
const avecAnnuler = (msg, avant) => info(msg, { label: 'Annuler', fn: () => { etat = { ...defaut(), ...JSON.parse(avant) }; sauver(); rendre(); } });

// ---------- Interface ----------
function repasActuel(lun, x) { const v = valideDe(lun, x.i, x.moment); return { v, r: v ? (CAT_PAR_ID[v.rid] || x.r) : x.r }; }
function ideesRepas() {
  const lun = iso(semaineAff), menu = menuSemaine(lun), nbVal = menu.filter(x => valideDe(lun, x.i, x.moment)).length;
  return `<section class="carte"><div class="carte-tete"><h2>Idées de la semaine</h2><span class="pill ${nbVal === 14 ? 'ok' : 'pri'}">${nbVal}/14 validés</span></div>
    <p class="mut">Deux repas par jour, différents chaque semaine. Touchez un repas pour voir la recette. « Valider » le planifie et envoie ses ingrédients dans les courses ; « Autre » invalide la recette et en propose une nouvelle.</p>
    ${JOURS.map((j, i) => `<h3>${fmtLong(iso(ajouteJours(parse(lun), i)))}</h3><ul class="liste">${menu.filter(x => x.i === i).map(x => {
      const { v, r } = repasActuel(lun, x), lib = x.moment === 'midi' ? 'Midi' : 'Soir';
      return `<li class="rang"><button class="rang-btn" data-act="ouvrir" data-sheet="idee" data-id="${r.id}" data-date="${x.date}" data-i="${i}" data-m="${x.moment}" data-lun="${lun}">
        <span class="heure" style="flex-basis:44px;font-size:.8rem">${lib}</span>
        <span class="rang-txt"><b>${esc(r.nom)}</b><small>${r.temps} min · ${r.tags.slice(0, 2).map(t => TAG_NOM[t] || t).join(', ')}${x.raison ? ' · ' + esc(x.raison) : ''}</small></span></button>
        ${v ? `<button class="pill ok" data-act="idee-annuler" data-lun="${lun}" data-i="${i}" data-m="${x.moment}" aria-label="Annuler la validation">✓ Validé</button>` : `<button class="btn" style="min-height:38px;padding:0 12px" data-act="idee-valider" data-lun="${lun}" data-i="${i}" data-m="${x.moment}">Valider</button>`}
        <button class="btn sec" style="min-height:38px;padding:0 10px" data-act="idee-refuser" data-lun="${lun}" data-i="${i}" data-m="${x.moment}" data-id="${r.id}" aria-label="Invalider ${esc(r.nom)} et proposer autre chose">Autre</button></li>`; }).join('')}</ul>`).join('')}
    <div class="rangee"><button class="btn" data-act="idees-valider"${nbVal === 14 ? ' disabled' : ''}>Valider toute la semaine</button>${nbVal ? '<button class="btn sec" data-act="idees-annuler">Annuler les validations</button>' : ''}</div></section>`;
}
SHEETS.idee = d => {
  const lun = d.lun, i = Number(d.i), m = d.m || 'soir', v = lun != null && d.i != null ? valideDe(lun, i, m) : null;
  const r = CAT_PAR_ID[d.id];
  if (!r) return { titre: 'Recette', corps: '<p>Recette introuvable.</p>' };
  const h = t => `<h3 class="mut" style="margin:0;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em">${t}</h3>`;
  const a = `data-lun="${lun}" data-i="${i}" data-m="${m}"`;
  return { titre: r.nom, corps: `<p class="mut">${r.portions} portions · ${r.temps} min${d.date ? ' · ' + (m === 'midi' ? 'midi' : 'soir') + ' · ' + fmtLong(d.date) : ''}</p>
    ${h('Ingrédients')}<ul class="liste">${r.ingredients.map(x => `<li class="rang" style="min-height:38px"><span class="rang-txt">${esc(x)}</span></li>`).join('')}</ul>
    ${h('Préparation')}<p style="color:var(--ink)">${esc(r.etapes)}</p>
    <small>Quantités pour 4 personnes : ajustez selon l’appétit. Pour un bébé, adaptez textures et aliments à son âge, avec l’avis du pédiatre.</small>
    ${d.date ? (v ? `<button class="btn sec plein" data-act="idee-annuler" ${a}>Annuler la validation (retire les ingrédients ajoutés)</button>`
      : `<button class="btn plein" data-act="idee-valider" ${a}>Valider : planifier et ajouter les ingrédients aux courses</button>`) : ''}
    <div class="rangee"><button class="btn sec" data-act="idee-ouvrir" data-id="${r.id}">Ouvrir dans mes recettes</button>${d.date ? `<button class="btn danger" data-act="idee-refuser" ${a} data-id="${r.id}">Invalider et proposer autre chose</button>` : ''}</div>` };
};
const slotDe = el => ({ lun: el.dataset.lun, i: Number(el.dataset.i), m: el.dataset.m || 'soir' });
const itemMenu = ({ lun, i, m }) => menuSemaine(lun).find(x => x.i === i && x.moment === m);
ACTIONS['idee-valider'] = el => {
  const s = slotDe(el), x = itemMenu(s), avant = JSON.stringify(etat);
  const n = validerRepas(s.lun, s.i, s.m, x.r, x.date);
  fermerFeuille();
  avecAnnuler(`« ${x.r.nom} » validé : ${n} ingrédient${pl(n)} ajouté${pl(n)} aux courses.`, avant);
};
ACTIONS['idee-annuler'] = el => { const s = slotDe(el); annulerRepas(s.lun, s.i, s.m); fermerFeuille(); info('Validation annulée, ingrédients retirés des courses.'); };
ACTIONS['idee-refuser'] = el => {
  const s = slotDe(el), avant = JSON.stringify(etat);
  invaliderRepas(s.lun, s.i, s.m, el.dataset.id);
  fermerFeuille();
  const x = itemMenu(s);
  avecAnnuler(`Recette invalidée. Nouvelle proposition : « ${x.r.nom} ».`, avant);
};
ACTIONS['idees-valider'] = () => {
  const lun = iso(semaineAff), menu = menuSemaine(lun), avant = JSON.stringify(etat);
  let n = 0, k = 0;
  menu.forEach(x => { if (!valideDe(lun, x.i, x.moment)) { n += validerRepas(lun, x.i, x.moment, x.r, x.date); k++; } });
  avecAnnuler(`${k} repas validé${pl(k)} : ${n} ingrédient${pl(n)} ajouté${pl(n)} aux courses.`, avant);
};
ACTIONS['idees-annuler'] = () => { const lun = iso(semaineAff); for (let i = 0; i < 7; i++) MOMENTS.forEach(([m]) => annulerRepas(lun, i, m)); info('Validations annulées, ingrédients retirés des courses.'); };
ACTIONS['idee-ouvrir'] = el => { const r = enregistrerRecette(CAT_PAR_ID[el.dataset.id]); sauver(); aller('recettes'); ouvrirFeuille('recette', { id: r.id }); };
