// ===================== DATA: skins, saddles, boosters, crafting, trolls, levels =====================
const SKINS=[
  {id:'helm_school',slot:'helmet',name:'Schooling Helmet',price:0,color:0x23232b,strap:0x111111,desc:'Plain black schooling helmet. Safe, cheap, every barn has a pile of them.'},
  {id:'helm_velvet',slot:'helmet',name:'Classic Velvet Hunt Cap',price:60,color:0x15151f,strap:0x7a5230,desc:'Black velvet with a tan harness. The hunter-ring classic.'},
  {id:'helm_rose',slot:'helmet',name:'Rose Gold Sparkle Helmet',price:180,color:0xe49aad,strap:0x3a2a30,stripe:0xffd9a0,desc:'Matte pink shell, rose-gold glitter center stripe.'},
  {id:'helm_navy',slot:'helmet',name:'Navy Wide-Brim Helmet',price:260,color:0x1f2f66,strap:0x111111,stripe:0xcfd4dc,wide:true,desc:'Navy shell, wide sun brim, chrome vent. Show-day shade.'},
  {id:'helm_pro',slot:'helmet',name:'Matte White Pro Helmet',price:420,color:0xf4f4f4,strap:0x222222,stripe:0x333333,desc:'Matte white carbon-look pro lid. Grand Prix energy.'},
  {id:'shirt_tee',slot:'shirt',name:'Barn T-Shirt',price:0,color:0xf2f2ee,sleeve:'short',desc:'Faded barn tee. Smells faintly of fly spray.'},
  {id:'shirt_show',slot:'shirt',name:'White Show Shirt',price:50,color:0xffffff,collar:0xffffff,sleeve:'long',desc:'Crisp white technical show shirt with a stock collar.'},
  {id:'shirt_pink',slot:'shirt',name:'Pink Sun Shirt',price:90,color:0xff8fc0,sleeve:'long',desc:'UV sun shirt in hot pink. Mesh underarms, zero fuss.'},
  {id:'shirt_polo',slot:'shirt',name:'Navy Polo',price:120,color:0x1e2d5c,collar:0x1e2d5c,sleeve:'short',desc:'Navy performance polo. Schooling-ring staple.'},
  {id:'shirt_teal',slot:'shirt',name:'Teal Show Shirt',price:200,color:0x2ec4b6,collar:0xffffff,sleeve:'long',desc:'Teal show shirt with a white contrast collar.'},
  {id:'shirt_coat',slot:'shirt',name:'Rainbow Show Coat',price:500,color:0x6b3fa0,collar:0xffd54a,sleeve:'long',coat:true,desc:'Violet show coat with gold piping and a rainbow lining. Trolls hate it.'},
  {id:'pants_tan',slot:'pants',name:'Tan Breeches',price:0,color:0xd2b48c,desc:'Everyday tan knee-patch breeches.'},
  {id:'pants_white',slot:'pants',name:'White Show Breeches',price:120,color:0xf7f7f7,desc:'Show-ring white. Good luck keeping them clean.'},
  {id:'pants_navy',slot:'pants',name:'Navy Full-Seat Breeches',price:180,color:0x1c2a55,desc:'Navy full-seat grip breeches. Stick like glue.'},
  {id:'pants_plum',slot:'pants',name:'Plum Breeches',price:220,color:0x7a2d6b,desc:'Plum with silicone knee patches. Loud and proud.'},
  {id:'boots_paddock',slot:'boots',name:'Brown Paddock Boots',price:0,color:0x6b4423,tall:false,desc:'Scuffed brown paddock boots. Short and comfy.'},
  {id:'boots_field',slot:'boots',name:'Tall Black Field Boots',price:160,color:0x151515,tall:true,desc:'Tall black field boots with laces. Needs a boot jack.'},
  {id:'boots_dress',slot:'boots',name:'Tall Brown Dress Boots',price:260,color:0x4a2a12,tall:true,desc:'Tall brown dress boots, Spanish top. Hunter derby chic.'},
  {id:'boots_patent',slot:'boots',name:'Patent-Top Field Boots',price:450,color:0x101010,tall:true,top:0x2a2a2a,shiny:true,desc:'Black field boots with a glossy patent top band.'},
  {id:'gloves_white',slot:'gloves',name:'White Show Gloves',price:30,color:0xffffff,desc:'White show gloves. Hide the ball-handling chalk.'},
  {id:'gloves_black',slot:'gloves',name:'Black Grip Gloves',price:60,color:0x1b1b1b,desc:'Black silicone-grip gloves. Better volleyball control.'},
  {id:'gloves_pink',slot:'gloves',name:'Pink Gloves',price:100,color:0xff6fb0,desc:'Hot pink mesh-back gloves.'},
  {id:'gloves_gold',slot:'gloves',name:'Gold Sparkle Gloves',price:300,color:0xffd54a,shiny:true,desc:'Gold glitter gloves. Catch the light, catch the trolls.'},
  {id:'vest_black',slot:'vest',name:'Black Air Vest',price:200,color:0x1d1d22,desc:'Inflatable air vest with a CO2 canister. Pops open if you fall.'},
  {id:'vest_pink',slot:'vest',name:'Hi-Vis Pink Air Vest',price:350,color:0xff3d8f,desc:'Hi-vis pink air vest. Visible from the next county.'},
  {id:'vest_blue',slot:'vest',name:'Royal Blue Air Vest',price:400,color:0x2252d9,desc:'Royal blue air vest with reflective piping.'},
];
const SLOTS=[['helmet','Helmets'],['shirt','Shirts & Coats'],['pants','Breeches'],['boots','Boots'],['gloves','Gloves'],['vest','Air Vests']];
const item=id=>SKINS.find(s=>s.id===id);

const SADDLES=[
  {id:'sad_loaner',name:'Barn Loaner Saddle',brand:'Unknown',type:'Worn all-purpose',price:'Free (it came with the lesson)',origin:'The back of the tack room',tree:'Wood, probably',panels:'Lumpy wool',color:0x5a4a3a,accent:0x3a2a1a,coinMult:1,window:0,rarity:'Starter',desc:'Cracked seat, one stirrup leather shorter than the other. It works.',level:0},
  {id:'sad_wintec',name:'Wintec 500 Jump',brand:'Wintec',type:'Synthetic jumping saddle',price:'about $880 new',origin:'Australia',tree:'HART adjustable gullet',panels:'CAIR air panels',color:0x2a2a2e,accent:0x4a4a52,coinMult:1.15,window:.06,rarity:'Common',desc:'Entry-level synthetic jumper. Weatherproof Equi-Suede seat, forward flaps with knee blocks, hose it off after a muddy day. The barn-lesson workhorse.',level:1},
  {id:'sad_bates',name:'Bates Caprilli Close Contact',brand:'Bates',type:'Leather close contact',price:'about $2,300 new',origin:'Australia',tree:'EASY-CHANGE adjustable',panels:'CAIR cushion',color:0x4a2c17,accent:0x6b4423,coinMult:1.3,window:.12,rarity:'Uncommon',desc:'Soft Luxe leather, flat seat, forward-cut flaps. The step-up saddle for a serious junior rider.',level:2},
  {id:'sad_cwd',name:'CWD SE02 2Gs',brand:'CWD',type:'French close contact',price:'about $6,000 new, $3,000 to $3,300 used',origin:'Nontron, France',tree:'Carbon-fiber 2Gs tree',panels:'Foam, pro-fitted',color:0x3a2314,accent:0xc9a24a,coinMult:1.6,window:.2,rarity:'Rare',desc:'Buffalo leather, semi-deep seat, carbon tree. The saddle every Grand Prix warm-up ring is full of.',level:3},
  {id:'sad_hermes',name:'Hermès Cavale II',brand:'Hermès',type:'Bespoke French jumping saddle',price:'Made to measure, five figures',origin:'Paris, France',tree:'Hand-built by one saddler',panels:'Latex foam, custom fit',color:0x2b1a0e,accent:0xf07f1a,coinMult:2,window:.28,rarity:'Legendary',desc:'Hand-stitched by a single craftsman to your measurements. Orange Hermès stitching on dark Barénia calfskin. The dream.',level:3},
];
const saddle=id=>SADDLES.find(s=>s.id===id)||SADDLES[0];

const BOOSTERS={
  boost:{id:'boost',name:'Boost',key:'1',color:0x3ec9ff,dur:8,desc:'Gallop 60% faster for 8 seconds. More fences, more coins. Dropped by Emerald Trolls.'},
  jump:{id:'jump',name:'Super Jump',key:'2',color:0xb45cff,dur:8,desc:'Huge jump arc and a much wider timing window for 8 seconds. Dropped by Sapphire Trolls.'},
};

const CRAFT=[
  {id:'shampoo',name:'Horse Shampoo',shape:'bottle',color:0x7fd3ff,desc:'Lavender horse shampoo.'},
  {id:'brush',name:'Body Brush',shape:'brush',color:0xa0522d,desc:'Soft body brush with a leather strap.'},
  {id:'sponge',name:'Bath Sponge',shape:'sponge',color:0xffe066,desc:'Big yellow bath sponge.'},
  {id:'bucket',name:'Water Bucket',shape:'bucket',color:0x3a7bd5,desc:'Blue rubber water bucket.'},
  {id:'carrot',name:'Carrot',shape:'carrot',color:0xff7a1a,desc:'A fat carrot. Horses lose their minds for these.'},
  {id:'apple',name:'Apple',shape:'apple',color:0xe0262c,desc:'Crisp red apple.'},
  {id:'pick',name:'Hoof Pick',shape:'pick',color:0x9a9aa2,desc:'Steel hoof pick with a rubber grip.'},
  {id:'oil',name:'Hoof Oil',shape:'jar',color:0x3a2a10,desc:'Tin of glossy hoof oil.'},
  {id:'comb',name:'Mane Comb',shape:'comb',color:0x222222,desc:'Fine-toothed mane comb.'},
  {id:'ribbon',name:'Ribbon Spool',shape:'ribbon',color:0xff5fa2,desc:'Pink braiding ribbon.'},
  {id:'mint',name:'Peppermint',shape:'mint',color:0xffffff,desc:'Red-and-white peppermint. Horses go feral for these.'},
  {id:'sugar',name:'Sugar Cube',shape:'cube',color:0xfafafa,desc:'One sugar cube. Just one.'},
];
const craftItem=id=>CRAFT.find(c=>c.id===id);
const RECIPES=[
  {a:'shampoo',b:'brush',id:'suds',name:'Soapy Suds',color:0xcfefff,desc:'Shampoo worked into a brush. Wash the horse until she gleams.',effect:'wash',verb:'Wash'},
  {a:'sponge',b:'bucket',id:'rinse',name:'Rinse Bucket',color:0x6fb7ff,desc:'Sponge and a bucket of clean water. Rinse the suds off.',effect:'rinse',verb:'Rinse'},
  {a:'carrot',b:'apple',id:'fruitsalad',name:'Carrot-Apple Salad',color:0xff9f43,desc:'Chopped carrot and apple in a feed scoop.',effect:'feed',verb:'Feed'},
  {a:'pick',b:'oil',id:'hoofkit',name:'Hoof Care Kit',color:0x8a6a3a,desc:'Pick out the hooves, then oil them to a mirror shine.',effect:'hooves',verb:'Polish hooves'},
  {a:'comb',b:'ribbon',id:'braidkit',name:'Braiding Kit',color:0xff8fc0,desc:'Comb and ribbon. Braid the mane show-style.',effect:'braid',verb:'Braid mane'},
  {a:'mint',b:'sugar',id:'minttreat',name:'Minty Sugar Treat',color:0xffd6e0,desc:'A peppermint pressed into a sugar cube.',effect:'treat',verb:'Give treat'},
];
const recipe=id=>RECIPES.find(r=>r.id===id);

const TROLLS=[
  {id:'ruby',name:'Ruby Troll',color:0xff2d4a,skin:0x9a6b57,hp:3,speed:2.3,dmg:1,size:1,hair:'mohawk',shorts:true,shoes:false,drops:{gold:.4,coins:[1,3]},desc:'Rainbow mohawk, rainbow shorts, red brows. Sometimes carries a gold volleyball.'},
  {id:'amber',name:'Amber Troll',color:0xff8c1a,skin:0x7f7a4a,hp:3,speed:2.5,dmg:1,size:.95,hair:'afro',shorts:false,shoes:true,pack:true,drops:{craft:.9,coins:[1,2]},desc:'Rainbow afro, rainbow-laced orange sneakers, and a backpack full of grooming gear.'},
  {id:'lemon',name:'Lemon Troll',color:0xffe135,skin:0xb08d57,hp:2,speed:3.8,dmg:1,size:.85,hair:'spikes',shorts:true,shoes:true,drops:{coins:[2,5]},desc:'Rainbow spikes. Fast, yellow-browed, annoying. Drops lots of coins.'},
  {id:'emerald',name:'Emerald Troll',color:0x2ee06b,skin:0x3f6b3a,hp:6,speed:1.5,dmg:2,size:1.3,hair:'dreads',shorts:true,shoes:false,drops:{boost:.5,coins:[2,4]},desc:'Big, slow, rainbow dreads with gold beads. Drops Boost for the arena.'},
  {id:'sapphire',name:'Sapphire Troll',color:0x3b7bff,skin:0x5a6a8a,hp:4,speed:2.7,dmg:1,size:1,hair:'topknot',shorts:false,shoes:true,vest:true,drops:{jump:.5,coins:[2,4]},desc:'Rainbow topknot, blue vest. Throws mud balls from range. Drops Super Jump.'},
  {id:'violet',name:'Violet Troll King',color:0xb04cff,skin:0x6a3f8a,hp:10,speed:2.1,dmg:2,size:1.45,hair:'crown',shorts:true,shoes:false,cape:true,drops:{gold:1,craft:1,coins:[6,10]},desc:'Rainbow mane and rainbow cape. Hurls mud fast. Always drops a gold volleyball.'},
];

const LEVELS=[
  {name:'The Tack Room Dungeon',desc:'Trolls have taken over the stable basement. Find 2 golden horseshoes to unlock the exit gate. Smash the troll nests or they keep spawning reinforcements. One cracked wall hides a saddle.',wall:[0x8d8577,0x4a443c],floor:[0x6a6258,0x4a443c],ceil:0x3a3330,fog:0x1a1620,lamp:0xffd9a8},
  {name:'Troll Market',desc:'A sprawling bazaar of rainbow trolls. Blue Sapphire trolls throw mud now, so keep moving. You need 3 golden horseshoes to open the exit. Amber trolls carry grooming gear.',wall:[0x9a5a4a,0x3a1f1f],floor:[0x7a5a48,0x4a2f28],ceil:0x3a2622,fog:0x1e1212,lamp:0xffc48a},
  {name:'Violet Keep',desc:'The Troll King\'s castle. 4 golden horseshoes open his throne room, and he is waiting behind the gate. Two hidden rooms, one holding a saddle that costs more than a car.',wall:[0x5a5890,0x1f1d3a],floor:[0x4a4870,0x2a2848],ceil:0x24223a,fog:0x120f22,lamp:0xd8c8ff},
];
// which saddle sits in each hidden room ($), in reading order per level
const LEVEL_SADDLES=[['sad_wintec'],['sad_bates'],['sad_cwd','sad_hermes']];
