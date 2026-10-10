// Illustrations de destination : silhouettes stylisées dessinées en SVG (aucune image externe).
// Chaque dessin tient dans une boîte 320 × 180, sol à y = 180, monument centré vers x = 228.
const IL_D = 'fill="#0d1530" fill-opacity=".82"', IL_B = 'fill="#fff" fill-opacity=".17"', IL_W = 'fill="#ffe7b0" fill-opacity=".92"';
const ilFenetres = (x, y, cols, rows, dx, dy, w = 4, h = 6) => Array.from({ length: cols * rows }, (_, i) => `<rect x="${x + (i % cols) * dx}" y="${y + Math.floor(i / cols) * dy}" width="${w}" height="${h}" ${IL_W} opacity=".7"/>`).join('');
const ilArches = (x0, y0, n, dx, w, h) => Array.from({ length: n }, (_, i) => `<path d="M${x0 + i * dx} ${y0 + h}v${-h + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0v${h - w / 2}z" ${IL_W} opacity=".55"/>`).join('');
const ilPalmier = (x, h, s = 1) => `<g transform="translate(${x} 180) scale(${s})"><path d="M0 0Q4 ${-h * .5} -2 ${-h}" stroke="#0d1530" stroke-opacity=".82" stroke-width="5" fill="none" stroke-linecap="round"/><g ${IL_D}><path d="M-2 ${-h}q-26 -4 -40 14q22 -12 40 -8z"/><path d="M-2 ${-h}q26 -6 42 10q-22 -10 -42 -4z"/><path d="M-2 ${-h}q-14 -20 -34 -20q22 4 34 20z"/><path d="M-2 ${-h}q14 -22 36 -18q-24 2 -36 18z"/><path d="M-2 ${-h}q-2 -20 6 -30q2 14 -6 30z"/></g></g>`;

const ILLU = [
  { cle: 'londres', mots: ['londres', 'london', 'angleterre', 'royaume-uni', 'royaume uni', 'ecosse', 'edimbourg', 'uk'], ciel: ['#4c5d86', '#f0a98b'], titre: 'Big Ben',
    dessin: () => `<g><circle cx="100" cy="112" r="52" fill="none" stroke="#0d1530" stroke-opacity=".6" stroke-width="2.5"/><circle cx="100" cy="112" r="3" ${IL_D}/>${Array.from({ length: 12 }, (_, i) => `<path d="M100 112L${100 + 52 * Math.cos(i * Math.PI / 6)} ${112 + 52 * Math.sin(i * Math.PI / 6)}" stroke="#0d1530" stroke-opacity=".28"/>`).join('')}<path d="M92 166l8 14l8 -14z" ${IL_D}/></g>
      <rect x="150" y="136" width="72" height="44" ${IL_D}/><rect x="158" y="124" width="10" height="14" ${IL_D}/><path d="M158 124l5 -14l5 14z" ${IL_D}/>${ilFenetres(156, 146, 7, 2, 9, 12, 3, 6)}
      <rect x="236" y="56" width="30" height="124" ${IL_D}/><rect x="233" y="44" width="36" height="14" ${IL_D}/><path d="M236 44L251 4L266 44z" ${IL_D}/><path d="M251 4v-8" stroke="#0d1530" stroke-width="2"/>
      <circle cx="251" cy="74" r="10" ${IL_W}/><path d="M251 74v-6M251 74l4 2" stroke="#0d1530" stroke-width="1.6"/><rect x="246" y="98" width="10" height="22" ${IL_W} opacity=".5"/>
      <path d="M0 180V168Q40 160 80 168T160 168T240 168T320 166V180z" ${IL_B}/>` },
  { cle: 'paris', mots: ['paris', 'versailles', 'tour eiffel'], ciel: ['#2c2f6e', '#f6a56d'], titre: 'Tour Eiffel',
    dessin: () => `<path d="M178 180L214 96L220 62L226 22L228 2L230 22L236 62L242 96L278 180L262 180Q228 142 194 180Z" ${IL_D}/>
      <rect x="212" y="90" width="32" height="5" ${IL_D}/><rect x="219" y="58" width="18" height="4" ${IL_D}/><path d="M205 124L251 124" stroke="#ffe7b0" stroke-opacity=".5"/>
      <path d="M200 150L256 150M214 112L242 112" stroke="#ffe7b0" stroke-opacity=".35"/><path d="M0 180V166L40 160L80 166L120 158L170 168V180z" ${IL_B}/><path d="M280 180V170L300 164L320 168V180z" ${IL_B}/>` },
  { cle: 'rome', mots: ['rome', 'colisee', 'italie', 'florence', 'naples', 'toscane', 'sicile'], ciel: ['#6a3c63', '#f2b36d'], titre: 'Colisée',
    dessin: () => `<path d="M128 180V104L142 92L190 84L228 86L262 82L304 100V180z" ${IL_D}/>${ilArches(136, 148, 8, 21, 12, 26)}${ilArches(136, 116, 8, 21, 12, 24)}<path d="M128 112H304M128 144H304" stroke="#0d1530" stroke-opacity=".5" stroke-width="3"/>
      <path d="M0 180V170Q60 150 110 168L128 180z" ${IL_B}/>` },
  { cle: 'newyork', mots: ['new york', 'newyork', 'nyc', 'manhattan', 'etats-unis', 'usa', 'etats unis', 'brooklyn', 'chicago', 'boston'], ciel: ['#26335f', '#ff9a76'], titre: 'Skyline de New York',
    dessin: () => `<g ${IL_B}><rect x="100" y="104" width="30" height="76"/><rect x="290" y="96" width="26" height="84"/></g>
      <rect x="138" y="120" width="26" height="60" ${IL_D}/><rect x="166" y="92" width="30" height="88" ${IL_D}/><rect x="198" y="132" width="20" height="48" ${IL_D}/>
      <path d="M232 180V70h6V52h8V34h6V6l3 -6l3 6v28h6v18h8v18h6V180z" ${IL_D}/><rect x="262" y="110" width="30" height="70" ${IL_D}/><rect x="294" y="128" width="26" height="52" ${IL_D}/><rect x="104" y="140" width="30" height="40" ${IL_D}/>
      ${ilFenetres(170, 100, 4, 5, 6, 14, 3, 6)}${ilFenetres(140, 130, 3, 3, 7, 14, 3, 6)}${ilFenetres(266, 120, 4, 4, 6, 14, 3, 6)}<path d="M0 180V172Q40 166 80 172T160 172" ${IL_B}/>` },
  { cle: 'barcelone', mots: ['barcelone', 'barcelona', 'espagne', 'madrid', 'seville', 'valence', 'sagrada'], ciel: ['#5a2d6b', '#ffb05f'], titre: 'Sagrada Família',
    dessin: () => `<rect x="150" y="128" width="156" height="52" ${IL_D}/>${[168, 198, 228, 258, 288].map((x, i) => { const h = [92, 54, 14, 54, 92][i]; return `<path d="M${x - 10} 130L${x - 6} ${h + 18}L${x} ${h}L${x + 6} ${h + 18}L${x + 10} 130z" ${IL_D}/><circle cx="${x}" cy="${h - 4}" r="4" ${IL_D}/>${ilFenetres(x - 2, h + 28, 1, 3, 0, 14, 4, 8)}`; }).join('')}
      <path d="M150 128h156" stroke="#ffe7b0" stroke-opacity=".3" stroke-width="2"/>${ilArches(160, 150, 6, 24, 14, 30)}<path d="M0 180V168Q60 156 110 170L150 180z" ${IL_B}/>` },
  { cle: 'amsterdam', mots: ['amsterdam', 'pays-bas', 'pays bas', 'hollande', 'rotterdam', 'bruges', 'belgique', 'bruxelles'], ciel: ['#3f5f86', '#f4c58a'], titre: 'Maisons sur les canaux',
    dessin: () => `${[[130, 82, 0], [164, 100, 1], [198, 70, 2], [232, 94, 0], [266, 80, 1], [300, 104, 2]].map(([x, h, g]) => `<g><path d="M${x} 150V${180 - h}${g === 0 ? 'h30' : g === 1 ? 'l15 -14l15 14' : 'h6v-6h6v-6h6v6h6v6h6'}V150z" ${IL_D}/>${ilFenetres(x + 6, 180 - h + 18, 2, 3, 12, 20, 6, 10)}</g>`).join('')}
      <path d="M0 150H320V180H0z" fill="#0d1530" fill-opacity=".55"/><path d="M20 160h60M120 166h90M240 160h70M60 172h80M200 174h100" stroke="#ffe7b0" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>` },
  { cle: 'tokyo', mots: ['tokyo', 'japon', 'kyoto', 'osaka', 'fuji', 'nippon'], ciel: ['#33256b', '#ff8f8f'], titre: 'Mont Fuji et torii',
    dessin: () => `<path d="M70 180L170 52Q190 28 210 52L320 180z" ${IL_D}/><path d="M156 70Q190 46 224 70L214 80L200 70L190 84L176 72L164 82z" fill="#fff" fill-opacity=".9"/>
      <g fill="#e2412b" fill-opacity=".95"><rect x="238" y="120" width="8" height="60"/><rect x="278" y="120" width="8" height="60"/><path d="M226 112Q262 124 298 112L296 124Q262 134 228 124z"/><rect x="238" y="132" width="48" height="6"/></g><path d="M0 180V170Q80 158 150 172T320 170V180z" ${IL_B}/>` },
  { cle: 'athenes', mots: ['athenes', 'grece', 'acropole', 'parthenon', 'santorin', 'mykonos', 'crete'], ciel: ['#2b5a8e', '#ffd08a'], titre: 'Parthénon',
    dessin: () => `<path d="M110 180L130 150H330V180z" ${IL_B}/><rect x="146" y="146" width="150" height="6" ${IL_D}/><rect x="152" y="140" width="138" height="6" ${IL_D}/>${Array.from({ length: 8 }, (_, i) => `<rect x="${158 + i * 18}" y="96" width="9" height="44" ${IL_D}/>`).join('')}
      <rect x="152" y="86" width="138" height="10" ${IL_D}/><path d="M148 86L221 56L294 86z" ${IL_D}/><path d="M221 60v-0" stroke="#0d1530"/><path d="M0 180V168Q30 150 70 166L110 180z" ${IL_B}/>` },
  { cle: 'venise', mots: ['venise', 'venezia', 'venice'], ciel: ['#6b4a7e', '#ffc58a'], titre: 'Gondole et campanile',
    dessin: () => `<g ${IL_D}><rect x="238" y="46" width="22" height="104"/><path d="M234 46L249 12L264 46z"/><rect x="241" y="38" width="16" height="8"/><path d="M130 150Q130 116 170 116Q210 116 210 150z"/><rect x="164" y="98" width="12" height="20"/><path d="M160 98L170 76L180 98z"/><rect x="190" y="110" width="40" height="40"/></g>
      ${ilFenetres(246, 60, 1, 4, 0, 20, 6, 10)}<path d="M0 150H320V180H0z" fill="#0d1530" fill-opacity=".5"/><path d="M60 168Q100 178 170 170Q214 164 236 152Q222 172 170 178Q100 184 60 168z" ${IL_D}/><path d="M236 152v-16" stroke="#0d1530" stroke-width="3"/>
      <path d="M20 162h50M240 170h60M110 176h30" stroke="#ffe7b0" stroke-opacity=".28" stroke-width="2" stroke-linecap="round"/>` },
  { cle: 'lisbonne', mots: ['lisbonne', 'lisboa', 'portugal', 'porto', 'algarve', 'madere'], ciel: ['#d86b6b', '#ffd27a'], titre: 'Tramway de Lisbonne',
    dessin: () => `<path d="M0 180V150L60 120L130 140L200 100L320 150V180z" ${IL_B}/>${[[150, 98], [188, 84], [228, 110], [268, 96]].map(([x, y]) => `<path d="M${x} 180V${y + 30}L${x + 17} ${y + 14}L${x + 34} ${y + 30}V180z" ${IL_D}/>`).join('')}
      <g transform="translate(130 128)"><rect x="0" y="0" width="120" height="38" rx="10" ${IL_D}/><path d="M30 0V-10H90V0" stroke="#0d1530" stroke-opacity=".8" stroke-width="3" fill="none"/>${[10, 38, 66, 94].map(x => `<rect x="${x}" y="8" width="18" height="14" rx="3" ${IL_W}/>`).join('')}<circle cx="24" cy="42" r="6" ${IL_D}/><circle cx="96" cy="42" r="6" ${IL_D}/></g>` },
  { cle: 'sydney', mots: ['sydney', 'australie', 'melbourne', 'opera'], ciel: ['#2c5e9a', '#ffb7a0'], titre: 'Opéra de Sydney',
    dessin: () => `<path d="M60 126Q180 20 300 126" stroke="#0d1530" stroke-opacity=".5" stroke-width="5" fill="none"/>
      <g ${IL_D}><path d="M150 160Q150 90 214 70Q200 110 214 160z"/><path d="M200 160Q196 100 252 80Q240 120 252 160z"/><path d="M244 160Q248 110 298 100Q286 130 298 160z"/><path d="M130 160Q132 120 170 108Q160 134 172 160z"/><rect x="120" y="156" width="190" height="24"/></g><path d="M0 180V172H320V180z" ${IL_B}/>` },
  { cle: 'marrakech', mots: ['marrakech', 'maroc', 'casablanca', 'essaouira', 'fes', 'agadir', 'tunisie', 'egypte', 'caire'], ciel: ['#7b3f5e', '#ffab62'], titre: 'Minaret de la Koutoubia',
    dessin: () => `<rect x="214" y="48" width="36" height="132" ${IL_D}/><rect x="222" y="30" width="20" height="18" ${IL_D}/><path d="M226 30l6 -16l6 16z" ${IL_D}/><circle cx="232" cy="8" r="5" ${IL_D}/>${[62, 88, 114].map(y => `<path d="M220 ${y + 14}v-8a12 12 0 0 1 24 0v8z" ${IL_W} opacity=".5"/>`).join('')}
      <path d="M120 180V150h60V180zM260 180V156h50V180z" ${IL_B}/>${ilPalmier(150, 90, .9)}${ilPalmier(290, 110, 1)}<path d="M0 180V170L50 160L110 170V180z" ${IL_B}/>` },
  { cle: 'istanbul', mots: ['istanbul', 'turquie', 'cappadoce', 'ankara'], ciel: ['#4a3a7a', '#ff9f6e'], titre: 'Sainte-Sophie',
    dessin: () => `<path d="M150 180V132Q150 78 228 78Q306 78 306 132V180z" ${IL_D}/><path d="M168 134Q168 100 190 100V134zM288 134Q288 100 266 100V134z" ${IL_D}/><circle cx="228" cy="74" r="2" ${IL_D}/><path d="M228 74V58M221 54a8 8 0 1 0 9 -9a6 6 0 1 1 -9 9" stroke="#0d1530" stroke-width="2" fill="none"/>
      ${[126, 306].map(x => `<g><rect x="${x - 6}" y="56" width="12" height="124" ${IL_D}/><path d="M${x - 8} 56L${x} 22L${x + 8} 56z" ${IL_D}/><rect x="${x - 9}" y="82" width="18" height="4" ${IL_D}/></g>`).join('')}${ilArches(172, 150, 6, 20, 10, 26)}<path d="M0 180V172H320V180z" ${IL_B}/>` },
  { cle: 'dubai', mots: ['dubai', 'emirats', 'abu dhabi', 'doha', 'qatar'], ciel: ['#1f3d6b', '#ffc27a'], titre: 'Burj Khalifa',
    dessin: () => `<path d="M216 180V110L222 100V70L226 56V34L229 20L231 -4L233 20L236 34V56L240 70V100L246 110V180z" ${IL_D}/><g ${IL_B}><rect x="150" y="104" width="24" height="76"/><rect x="290" y="92" width="24" height="88"/></g>
      <g ${IL_D}><rect x="176" y="120" width="26" height="60"/><rect x="258" y="130" width="28" height="50"/><rect x="130" y="144" width="30" height="36"/><path d="M288 180V150Q288 120 306 120Q324 120 324 150V180z"/></g>${ilFenetres(180, 130, 4, 4, 6, 12, 3, 5)}` },
  { cle: 'berlin', mots: ['berlin', 'allemagne', 'munich', 'hambourg', 'brandebourg', 'vienne', 'autriche', 'prague'], ciel: ['#3b4a7a', '#f4b97c'], titre: 'Porte de Brandebourg',
    dessin: () => `${Array.from({ length: 6 }, (_, i) => `<rect x="${146 + i * 28}" y="86" width="14" height="94" ${IL_D}/>`).join('')}<rect x="136" y="70" width="170" height="16" ${IL_D}/><rect x="146" y="56" width="150" height="14" ${IL_D}/>
      <g ${IL_D}><rect x="204" y="38" width="34" height="18"/><path d="M200 38q4 -16 20 -16q18 0 22 16z"/><path d="M220 22V8l10 4l-10 4"/></g><path d="M0 180V170H320V180z" ${IL_B}/>` },
  { cle: 'pise', mots: ['pise', 'pisa'], ciel: ['#5a76a8', '#ffe0a0'], titre: 'Tour de Pise',
    dessin: () => `<g transform="rotate(5 232 180)">${Array.from({ length: 7 }, (_, i) => `<rect x="214" y="${150 - i * 17}" width="36" height="17" ${IL_D}/><path d="M214 ${150 - i * 17}h36" stroke="#ffe7b0" stroke-opacity=".35" stroke-width="2"/>${ilArches(218, 154 - i * 17, 4, 8, 5, 9)}`).join('')}<rect x="220" y="14" width="24" height="16" ${IL_D}/><path d="M220 14h24l-4 -8h-16z" ${IL_D}/></g>
      <path d="M110 180V150Q110 120 150 120Q190 120 190 150V180z" ${IL_B}/><path d="M0 180V172H320V180z" ${IL_B}/>` },
  { cle: 'plage', mots: ['plage', 'ile', 'bali', 'maldives', 'canaries', 'majorque', 'ibiza', 'corse', 'antilles', 'thailande', 'mer', 'cote', 'mauritius', 'maurice', 'reunion', 'guadeloupe', 'martinique', 'hawai', 'tenerife', 'cuba', 'mexique', 'cancun', 'caraibes', 'croisiere', 'sardaigne', 'biarritz', 'nice', 'cannes'], ciel: ['#2d7fb8', '#ffcf8a'], titre: 'Palmiers et plage',
    dessin: () => `<circle cx="120" cy="104" r="30" fill="#ffe7b0" fill-opacity=".9"/><path d="M0 148Q40 140 80 148T160 148T240 148T320 148V180H0z" fill="#0d1530" fill-opacity=".38"/><path d="M0 164Q80 150 180 162T320 156V180H0z" ${IL_D}/>${ilPalmier(226, 120, 1.1)}${ilPalmier(274, 90, .85)}<path d="M20 140h40M200 132h50M130 156h60" stroke="#fff" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>` },
  { cle: 'montagne', mots: ['montagne', 'alpes', 'ski', 'chamonix', 'pyrenees', 'suisse', 'dolomites', 'norvege', 'savoie', 'randonnee', 'canada', 'nepal', 'islande', 'ecosse', 'vosges', 'jura', 'andorre', 'autriche'], ciel: ['#3b4f8c', '#f6b48a'], titre: 'Montagnes',
    dessin: () => `<path d="M100 180L190 70L240 126L270 90L340 180z" ${IL_B}/><path d="M130 180L230 36L330 180z" ${IL_D}/><path d="M205 70L230 36L255 70L240 64L230 78L220 64z" fill="#fff" fill-opacity=".9"/><path d="M60 180L120 100L180 180z" ${IL_D}/><path d="M104 120L120 100L136 120L126 116L120 124L112 116z" fill="#fff" fill-opacity=".85"/>
      <path d="M0 180V168Q60 160 120 172V180z" ${IL_D}/><path d="M270 180l8 -28l8 28M286 180l10 -34l10 34" ${IL_D}/>` },
];
const ILLU_DEFAUT = { cle: 'voyage', ciel: ['#3a4f9a', '#ffc58a'], titre: 'En voyage',
  dessin: () => `<circle cx="96" cy="110" r="26" fill="#ffe7b0" fill-opacity=".9"/><path d="M0 180V160Q50 140 110 156T220 150T320 156V180z" ${IL_B}/><path d="M0 180V170Q70 156 140 170T320 168V180z" ${IL_D}/>
    <g transform="translate(200 54) rotate(-12)" ${IL_D}><path d="M0 12L70 6Q84 6 84 12Q84 18 70 18z"/><path d="M26 12L46 -16H54L44 12z"/><path d="M26 12L46 40H54L44 12z"/><path d="M0 12L-8 0H0L10 10z"/></g>
    <path d="M230 120q10 -14 24 -10q12 -12 28 0q14 -2 18 10z" fill="#fff" fill-opacity=".55"/><path d="M30 70q10 -12 24 -8q12 -10 26 2q12 0 16 8z" fill="#fff" fill-opacity=".4"/>` };
const sansAccent = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function illustrationDe(dest) {
  const t = ' ' + sansAccent(dest).replace(/[^a-z0-9' -]/g, ' ') + ' ';
  if (!t.trim()) return ILLU_DEFAUT;
  return ILLU.find(i => i.mots.some(m => t.includes(' ' + m + ' ') || (m.length > 4 && t.includes(m)))) || ILLU_DEFAUT;
}
const illuSvg = (dest, cls = 'illu') => { const i = illustrationDe(dest); return `<svg class="${cls}" viewBox="0 -24 320 204" preserveAspectRatio="xMaxYMax slice" role="img" aria-label="Illustration : ${esc(i.titre)}">${i.dessin()}</svg>`; };
const illuFond = dest => { const [a, b] = illustrationDe(dest).ciel; return `linear-gradient(180deg,${a},${b})`; };
