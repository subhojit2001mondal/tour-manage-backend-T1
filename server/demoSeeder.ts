import { adminDb, adminAuth, Timestamp } from './firebaseAdmin.ts';

// 48 Required Destinations across India
export const DEMO_DESTINATIONS = [
  // North
  {
    id: 'kashmir',
    name: 'Kashmir (Srinagar, Gulmarg, Pahalgam)',
    state: 'Jammu & Kashmir',
    region: 'North',
    description: 'The Paradise on Earth featuring serene Dal Lake houseboats, snow-clad Gulmarg meadows, saffron valleys of Pampore, and the gushing rivers of Pahalgam.',
    coverImageUrl: 'https://picsum.photos/seed/kashmir-paradise/800/600',
    galleryUrls: ['https://picsum.photos/seed/gulmarg-snow/800/600', 'https://picsum.photos/seed/dal-lake-shikara/800/600'],
    bestSeason: 'Apr - Oct (Snow: Dec - Feb)',
    tags: ['Valleys', 'Snow', 'Lakes', 'Romance', 'Houseboat'],
    featured: true,
    active: true,
  },
  {
    id: 'leh-ladakh',
    name: 'Leh-Ladakh',
    state: 'Ladakh',
    region: 'North',
    description: 'High-altitude desert wonderland with dramatic mountain passes, ancient Tibetan Buddhist monasteries, and the crystal turquoise waters of Pangong Tso.',
    coverImageUrl: 'https://picsum.photos/seed/leh-ladakh/800/600',
    galleryUrls: ['https://picsum.photos/seed/pangong-tso/800/600', 'https://picsum.photos/seed/nubra-valley/800/600'],
    bestSeason: 'May - Sep',
    tags: ['Adventure', 'Biking', 'Monasteries', 'High Altitude', 'Lakes'],
    featured: true,
    active: true,
  },
  {
    id: 'manali',
    name: 'Manali & Solang',
    state: 'Himachal Pradesh',
    region: 'North',
    description: 'A Himalayan retreat packed with pine forests, Beas river rapids, snow sports at Solang Valley, and scenic mountain cafes in Old Manali.',
    coverImageUrl: 'https://picsum.photos/seed/manali-himalayas/800/600',
    galleryUrls: ['https://picsum.photos/seed/solang-valley/800/600'],
    bestSeason: 'Oct - Jun',
    tags: ['Himalayas', 'Adventure', 'Snow', 'Trekking'],
    featured: true,
    active: true,
  },
  {
    id: 'shimla',
    name: 'Shimla',
    state: 'Himachal Pradesh',
    region: 'North',
    description: 'The Queen of Hills with colonial heritage architecture, the bustling Mall Road, historic Toy Train railway, and panoramic ridge views.',
    coverImageUrl: 'https://picsum.photos/seed/shimla-hills/800/600',
    galleryUrls: ['https://picsum.photos/seed/kalka-shimla/800/600'],
    bestSeason: 'Mar - Jun & Dec - Jan',
    tags: ['Colonial', 'Hills', 'Family', 'Heritage'],
    featured: false,
    active: true,
  },
  {
    id: 'dharamshala-mcleodganj',
    name: 'Dharamshala & McLeodganj',
    state: 'Himachal Pradesh',
    region: 'North',
    description: 'The vibrant residence of His Holiness the Dalai Lama, nestled among cedar forests and offering Tibetan cafes, monasteries, and Triund trek.',
    coverImageUrl: 'https://picsum.photos/seed/mcleodganj-dalai/800/600',
    galleryUrls: ['https://picsum.photos/seed/triund-trek/800/600'],
    bestSeason: 'Sep - Jun',
    tags: ['Tibetan', 'Peace', 'Trekking', 'Culture'],
    featured: false,
    active: true,
  },
  {
    id: 'spiti-valley',
    name: 'Spiti Valley',
    state: 'Himachal Pradesh',
    region: 'North',
    description: 'Rugged Middle Land between India and Tibet boasting millennium-old monasteries like Key Gompa, Chandratal lake, and highest motorable villages.',
    coverImageUrl: 'https://picsum.photos/seed/spiti-valley/800/600',
    galleryUrls: ['https://picsum.photos/seed/key-monastery/800/600'],
    bestSeason: 'Jun - Sep',
    tags: ['Rugged', 'Remote', 'Adventure', 'Stargazing'],
    featured: true,
    active: true,
  },
  {
    id: 'rishikesh-haridwar',
    name: 'Rishikesh & Haridwar',
    state: 'Uttarakhand',
    region: 'North',
    description: 'The Yoga Capital of the world and sacred gateway along the holy Ganga, famous for Ganga Aarti, yoga retreats, and river rafting.',
    coverImageUrl: 'https://picsum.photos/seed/rishikesh-ganga/800/600',
    galleryUrls: ['https://picsum.photos/seed/haridwar-aarti/800/600'],
    bestSeason: 'Sep - Apr',
    tags: ['Spiritual', 'Rafting', 'Yoga', 'Ganga'],
    featured: true,
    active: true,
  },
  {
    id: 'nainital-jim-corbett',
    name: 'Nainital & Jim Corbett',
    state: 'Uttarakhand',
    region: 'North',
    description: 'A blend of shimmering emerald lake town in Kumaon and India’s oldest national park renowned for Royal Bengal Tiger safaris.',
    coverImageUrl: 'https://picsum.photos/seed/jim-corbett-tiger/800/600',
    galleryUrls: ['https://picsum.photos/seed/naini-lake/800/600'],
    bestSeason: 'Oct - Jun',
    tags: ['Wildlife', 'Safari', 'Lakes', 'Nature'],
    featured: false,
    active: true,
  },
  {
    id: 'mussoorie',
    name: 'Mussoorie',
    state: 'Uttarakhand',
    region: 'North',
    description: 'Picturesque Queen of the Hills overlooking the Doon Valley, famous for Kempty Falls, Camel’s Back Road, and pleasant mountain breezes.',
    coverImageUrl: 'https://picsum.photos/seed/mussoorie-hills/800/600',
    galleryUrls: ['https://picsum.photos/seed/kempty-falls/800/600'],
    bestSeason: 'Mar - Jun & Sep - Nov',
    tags: ['Hills', 'Scenic', 'Weekend', 'Romantic'],
    featured: false,
    active: true,
  },
  {
    id: 'amritsar',
    name: 'Amritsar',
    state: 'Punjab',
    region: 'North',
    description: 'Spiritual heart of Sikhism with the breathtaking Golden Temple, community Langar, historic Jallianwala Bagh, and Wagah Border ceremony.',
    coverImageUrl: 'https://picsum.photos/seed/amritsar-golden-temple/800/600',
    galleryUrls: ['https://picsum.photos/seed/wagah-border/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Spiritual', 'Heritage', 'Foodie', 'Patriotic'],
    featured: false,
    active: true,
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    region: 'North',
    description: 'One of the world’s oldest living cities on the banks of holy Ganga, celebrated for mystical ghats, morning boat rides, and evening Ganga Aarti.',
    coverImageUrl: 'https://picsum.photos/seed/varanasi-ghats/800/600',
    galleryUrls: ['https://picsum.photos/seed/varanasi-aarti/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Ancient', 'Spiritual', 'Ghats', 'Culture'],
    featured: true,
    active: true,
  },
  {
    id: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    region: 'North',
    description: 'Home of the timeless white marble wonder Taj Mahal, alongside Agra Fort, Fatehpur Sikri, and rich Mughal culinary treasures.',
    coverImageUrl: 'https://picsum.photos/seed/agra-taj-mahal/800/600',
    galleryUrls: ['https://picsum.photos/seed/agra-fort/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Mughal', 'Monument', 'Wonder', 'History'],
    featured: true,
    active: true,
  },
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'Delhi NCR',
    region: 'North',
    description: 'The monumental capital city where Mughal marvels, colonial Lutyens grandeur, historic bazaars of Chandni Chowk, and contemporary energy meet.',
    coverImageUrl: 'https://picsum.photos/seed/delhi-india-gate/800/600',
    galleryUrls: ['https://picsum.photos/seed/red-fort/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Capital', 'Monuments', 'Street Food', 'Shopping'],
    featured: false,
    active: true,
  },

  // West
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    region: 'West',
    description: 'The historic Pink City adorned with Amber Fort, Hawa Mahal, City Palace, lively craft bazaars, and opulent royal Rajasthani hospitality.',
    coverImageUrl: 'https://picsum.photos/seed/jaipur-hawa-mahal/800/600',
    galleryUrls: ['https://picsum.photos/seed/amber-fort/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Royal', 'Forts', 'Heritage', 'Culture'],
    featured: true,
    active: true,
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    state: 'Rajasthan',
    region: 'West',
    description: 'The romantic City of Lakes featuring majestic City Palace, shimmering Lake Pichola boat cruises, Jag Mandir, and royal heritage havelis.',
    coverImageUrl: 'https://picsum.photos/seed/udaipur-lake-palace/800/600',
    galleryUrls: ['https://picsum.photos/seed/lake-pichola/800/600'],
    bestSeason: 'Sep - Mar',
    tags: ['Lakes', 'Palaces', 'Romance', 'Heritage'],
    featured: true,
    active: true,
  },
  {
    id: 'jaisalmer',
    name: 'Jaisalmer',
    state: 'Rajasthan',
    region: 'West',
    description: 'The Golden City rising from the Thar Desert with its living sand fort, carved yellow sandstone havelis, and magical desert tent safaris.',
    coverImageUrl: 'https://picsum.photos/seed/jaisalmer-desert/800/600',
    galleryUrls: ['https://picsum.photos/seed/sam-sand-dunes/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Desert', 'Camel Safari', 'Fort', 'Camps'],
    featured: false,
    active: true,
  },
  {
    id: 'jodhpur',
    name: 'Jodhpur',
    state: 'Rajasthan',
    region: 'West',
    description: 'The Blue City crowned by the colossal Mehrangarh Fort, vibrant old indigo lanes, Umaid Bhawan Palace, and iconic mawa kachori.',
    coverImageUrl: 'https://picsum.photos/seed/jodhpur-mehrangarh/800/600',
    galleryUrls: ['https://picsum.photos/seed/blue-city-jodhpur/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Forts', 'Heritage', 'Architecture', 'Culture'],
    featured: false,
    active: true,
  },
  {
    id: 'rann-of-kutch',
    name: 'Rann of Kutch',
    state: 'Gujarat',
    region: 'West',
    description: 'The great white salt desert that transforms during the Rann Utsav under the full moon, celebrating Kutchi embroidery, music, and art.',
    coverImageUrl: 'https://picsum.photos/seed/rann-of-kutch/800/600',
    galleryUrls: ['https://picsum.photos/seed/kutch-white-desert/800/600'],
    bestSeason: 'Nov - Feb',
    tags: ['White Desert', 'Festival', 'Handicrafts', 'Full Moon'],
    featured: false,
    active: true,
  },
  {
    id: 'gir-national-park',
    name: 'Gir National Park',
    state: 'Gujarat',
    region: 'West',
    description: 'The sole remaining natural sanctuary of the magnificent Asiatic Lion, featuring teak forest jeep safaris and rich birdlife.',
    coverImageUrl: 'https://picsum.photos/seed/gir-asiatic-lion/800/600',
    galleryUrls: ['https://picsum.photos/seed/gir-forest-safari/800/600'],
    bestSeason: 'Dec - Mar',
    tags: ['Asiatic Lion', 'Wildlife', 'Safari', 'Conservation'],
    featured: false,
    active: true,
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    description: 'The City of Dreams boasting Gateway of India, scenic Marine Drive promenade, colonial architecture, Bollywood, and vibrant coastal cuisine.',
    coverImageUrl: 'https://picsum.photos/seed/mumbai-gateway/800/600',
    galleryUrls: ['https://picsum.photos/seed/marine-drive/800/600'],
    bestSeason: 'Nov - Feb',
    tags: ['Cosmopolitan', 'Seacoast', 'Bollywood', 'Heritage'],
    featured: false,
    active: true,
  },
  {
    id: 'ajanta-ellora',
    name: 'Ajanta & Ellora Caves',
    state: 'Maharashtra',
    region: 'West',
    description: 'UNESCO World Heritage rock-cut masterpieces, including ancient Buddhist cave murals at Ajanta and the mind-boggling monolithic Kailash Temple at Ellora.',
    coverImageUrl: 'https://picsum.photos/seed/kailash-temple-ellora/800/600',
    galleryUrls: ['https://picsum.photos/seed/ajanta-caves/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['UNESCO', 'Rock-cut', 'Ancient Art', 'Archaeology'],
    featured: false,
    active: true,
  },
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    region: 'West',
    description: 'Sun-drenched tropical coastline with golden beaches, Portuguese heritage churches, vibrant beach shacks, spice plantations, and water sports.',
    coverImageUrl: 'https://picsum.photos/seed/goa-beach/800/600',
    galleryUrls: ['https://picsum.photos/seed/palolem-beach/800/600', 'https://picsum.photos/seed/old-goa-church/800/600'],
    bestSeason: 'Oct - Apr',
    tags: ['Beaches', 'Seafood', 'Parties', 'Relaxation', 'Heritage'],
    featured: true,
    active: true,
  },

  // Central
  {
    id: 'khajuraho',
    name: 'Khajuraho',
    state: 'Madhya Pradesh',
    region: 'Central',
    description: 'Celebrated for breathtaking medieval Hindu and Jain temples adorned with intricate, erotic, and expressive nagara architectural carvings.',
    coverImageUrl: 'https://picsum.photos/seed/khajuraho-temple/800/600',
    galleryUrls: ['https://picsum.photos/seed/kandariya-mahadeva/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['UNESCO', 'Architecture', 'Sculptures', 'History'],
    featured: false,
    active: true,
  },
  {
    id: 'kanha-national-park',
    name: 'Kanha National Park',
    state: 'Madhya Pradesh',
    region: 'Central',
    description: 'The lush sal and bamboo forest that inspired Rudyard Kipling’s The Jungle Book, home to tigers, leopards, and rare hardground swamp deer (Barasingha).',
    coverImageUrl: 'https://picsum.photos/seed/kanha-tiger-safari/800/600',
    galleryUrls: ['https://picsum.photos/seed/kanha-meadows/800/600'],
    bestSeason: 'Oct - May',
    tags: ['Jungle Book', 'Tigers', 'Wildlife', 'Ecotourism'],
    featured: false,
    active: true,
  },

  // South
  {
    id: 'munnar',
    name: 'Munnar',
    state: 'Kerala',
    region: 'South',
    description: 'Rolling emerald tea plantations, mist-covered Western Ghats peaks, aromatic spice gardens, and cool mountain air in God’s Own Country.',
    coverImageUrl: 'https://picsum.photos/seed/munnar-tea-gardens/800/600',
    galleryUrls: ['https://picsum.photos/seed/anamudi-munnar/800/600'],
    bestSeason: 'Sep - May',
    tags: ['Tea Gardens', 'Misty Hills', 'Honeymoon', 'Nature'],
    featured: true,
    active: true,
  },
  {
    id: 'alleppey',
    name: 'Alleppey Backwaters',
    state: 'Kerala',
    region: 'South',
    description: 'The Venice of the East famous for tranquil overnight houseboat cruises navigating coconut-fringed lagoons, paddy fields, and backwater canals.',
    coverImageUrl: 'https://picsum.photos/seed/alleppey-houseboat/800/600',
    galleryUrls: ['https://picsum.photos/seed/kerala-backwaters/800/600'],
    bestSeason: 'Sep - Mar',
    tags: ['Houseboat', 'Backwaters', 'Ayurveda', 'Kerala'],
    featured: true,
    active: true,
  },
  {
    id: 'kochi',
    name: 'Kochi',
    state: 'Kerala',
    region: 'South',
    description: 'Historic spice port city featuring cantilevered Chinese fishing nets, colonial Fort Kochi streets, Mattancherry palace, and vibrant Kathakali dance.',
    coverImageUrl: 'https://picsum.photos/seed/kochi-fishing-nets/800/600',
    galleryUrls: ['https://picsum.photos/seed/fort-kochi-streets/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Spice Route', 'Colonial', 'Art Biennale', 'Coastal'],
    featured: false,
    active: true,
  },
  {
    id: 'ooty',
    name: 'Ooty & Nilgiris',
    state: 'Tamil Nadu',
    region: 'South',
    description: 'The charming hill station of the Nilgiris featuring UNESCO toy train, botanical gardens, tea estates, Doddabetta Peak, and scenic lake boating.',
    coverImageUrl: 'https://picsum.photos/seed/ooty-nilgiris/800/600',
    galleryUrls: ['https://picsum.photos/seed/nilgiri-toy-train/800/600'],
    bestSeason: 'Mar - Jun & Sep - Nov',
    tags: ['Hills', 'Toy Train', 'Tea Estates', 'Cool Climate'],
    featured: false,
    active: true,
  },
  {
    id: 'madurai-rameswaram',
    name: 'Madurai & Rameswaram',
    state: 'Tamil Nadu',
    region: 'South',
    description: 'Spiritual odyssey covering the towering gopurams of Meenakshi Amman Temple and the sacred island shrine of Rameswaram with historic Pamban Bridge.',
    coverImageUrl: 'https://picsum.photos/seed/meenakshi-temple/800/600',
    galleryUrls: ['https://picsum.photos/seed/pamban-bridge/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Dravidian Temples', 'Pilgrimage', 'Sacred', 'Ocean'],
    featured: false,
    active: true,
  },
  {
    id: 'coorg',
    name: 'Coorg (Kodagu)',
    state: 'Karnataka',
    region: 'South',
    description: 'The Scotland of India surrounded by fragrant coffee plantations, pepper vines, Abbey Falls, Nagarhole wildlife, and unique Kodava culture.',
    coverImageUrl: 'https://picsum.photos/seed/coorg-coffee-estate/800/600',
    galleryUrls: ['https://picsum.photos/seed/abbey-falls/800/600'],
    bestSeason: 'Oct - Apr',
    tags: ['Coffee', 'Waterfalls', 'Plantations', 'Hills'],
    featured: false,
    active: true,
  },
  {
    id: 'hampi',
    name: 'Hampi',
    state: 'Karnataka',
    region: 'South',
    description: 'Surreal boulder-strewn open-air museum and UNESCO site showcasing the magnificent ruins of the Vijayanagara Empire along the Tungabhadra River.',
    coverImageUrl: 'https://picsum.photos/seed/hampi-stone-chariot/800/600',
    galleryUrls: ['https://picsum.photos/seed/virupaksha-temple/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['UNESCO', 'Ruins', 'History', 'Boulders', 'Architecture'],
    featured: false,
    active: true,
  },
  {
    id: 'mysuru',
    name: 'Mysuru',
    state: 'Karnataka',
    region: 'South',
    description: 'The Royal City celebrated for the lavishly illuminated Mysore Palace, rich sandalwood handicrafts, silk sarees, and royal Dasara festivities.',
    coverImageUrl: 'https://picsum.photos/seed/mysore-palace/800/600',
    galleryUrls: ['https://picsum.photos/seed/chamundi-hill/800/600'],
    bestSeason: 'Sep - Mar',
    tags: ['Palace', 'Royalty', 'Heritage', 'Silk'],
    featured: false,
    active: true,
  },
  {
    id: 'puducherry',
    name: 'Puducherry',
    state: 'Puducherry UT',
    region: 'South',
    description: 'Charming French-colonial seaside enclave with pastel villas, bougainvillea-lined avenues, Promenade Beach, cafes, and peaceful Auroville.',
    coverImageUrl: 'https://picsum.photos/seed/pondicherry-french-quarter/800/600',
    galleryUrls: ['https://picsum.photos/seed/auroville-matrimandir/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['French Colony', 'Beach Promenade', 'Auroville', 'Cafes'],
    featured: false,
    active: true,
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    region: 'South',
    description: 'The City of Pearls blending regal Nizami heritage with Golconda Fort, Charminar, world-famous Dum Biryani, and modern tech dynamism.',
    coverImageUrl: 'https://picsum.photos/seed/hyderabad-charminar/800/600',
    galleryUrls: ['https://picsum.photos/seed/golconda-fort/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Nizami', 'Biryani', 'Forts', 'Pearls'],
    featured: false,
    active: true,
  },
  {
    id: 'tirupati',
    name: 'Tirupati',
    state: 'Andhra Pradesh',
    region: 'South',
    description: 'One of the most visited sacred pilgrimage centers in the world, home to the revered Sri Venkateswara Swamy Temple atop the Seven Hills of Tirumala.',
    coverImageUrl: 'https://picsum.photos/seed/tirupati-balaji/800/600',
    galleryUrls: ['https://picsum.photos/seed/tirumala-hills/800/600'],
    bestSeason: 'Sep - Mar',
    tags: ['Pilgrimage', 'Tirumala', 'Sacred', 'Spiritual'],
    featured: false,
    active: true,
  },
  {
    id: 'araku-valley',
    name: 'Araku Valley',
    state: 'Andhra Pradesh',
    region: 'South',
    description: 'Scenic hill station in the Eastern Ghats famous for coffee plantations, organic tribal honey, Borra Caves stalactites, and train journey through 84 tunnels.',
    coverImageUrl: 'https://picsum.photos/seed/araku-valley/800/600',
    galleryUrls: ['https://picsum.photos/seed/borra-caves/800/600'],
    bestSeason: 'Sep - Mar',
    tags: ['Eastern Ghats', 'Coffee', 'Caves', 'Tribal'],
    featured: false,
    active: true,
  },

  // East
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    region: 'East',
    description: 'The Cultural Capital of India with Victoria Memorial, historic yellow taxis, Howrah Bridge, Durga Puja grandeur, and legendary sweets.',
    coverImageUrl: 'https://picsum.photos/seed/kolkata-victoria-memorial/800/600',
    galleryUrls: ['https://picsum.photos/seed/howrah-bridge/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Culture', 'Literature', 'Heritage', 'Sweets'],
    featured: false,
    active: true,
  },
  {
    id: 'darjeeling',
    name: 'Darjeeling',
    state: 'West Bengal',
    region: 'East',
    description: 'The Queen of the Himalayas renowned for fragrant tea gardens, panoramic views of Mt. Kanchenjunga from Tiger Hill, and the UNESCO Himalayan Railway.',
    coverImageUrl: 'https://picsum.photos/seed/darjeeling-tea-estate/800/600',
    galleryUrls: ['https://picsum.photos/seed/tiger-hill-kanchenjunga/800/600'],
    bestSeason: 'Mar - May & Oct - Dec',
    tags: ['Tea Estates', 'Kanchenjunga', 'Toy Train', 'Mountains'],
    featured: true,
    active: true,
  },
  {
    id: 'sundarbans',
    name: 'Sundarbans Biosphere',
    state: 'West Bengal',
    region: 'East',
    description: 'The world’s largest mangrove delta forest and UNESCO sanctuary, home of swimming Royal Bengal Tigers, estuarine crocodiles, and boat safaris.',
    coverImageUrl: 'https://picsum.photos/seed/sundarbans-mangroves/800/600',
    galleryUrls: ['https://picsum.photos/seed/sundarbans-boat-safari/800/600'],
    bestSeason: 'Nov - Mar',
    tags: ['Mangroves', 'Tigers', 'Wildlife', 'Delta'],
    featured: false,
    active: true,
  },
  {
    id: 'puri-konark',
    name: 'Puri & Konark',
    state: 'Odisha',
    region: 'East',
    description: 'Spiritual coastal realm featuring the sacred Jagannath Temple, golden surf beaches of Puri, and the monumental 13th-century Konark Sun Temple chariot.',
    coverImageUrl: 'https://picsum.photos/seed/konark-sun-temple/800/600',
    galleryUrls: ['https://picsum.photos/seed/puri-beach-jagannath/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Sun Temple', 'Beaches', 'Pilgrimage', 'Architecture'],
    featured: false,
    active: true,
  },
  {
    id: 'bodh-gaya',
    name: 'Bodh Gaya',
    state: 'Bihar',
    region: 'East',
    description: 'The holiest Buddhist pilgrimage site on Earth where Siddhartha Gautama attained enlightenment beneath the sacred Bodhi Tree at Mahabodhi Temple.',
    coverImageUrl: 'https://picsum.photos/seed/mahabodhi-temple/800/600',
    galleryUrls: ['https://picsum.photos/seed/bodhi-tree/800/600'],
    bestSeason: 'Oct - Mar',
    tags: ['Buddhism', 'Enlightenment', 'UNESCO', 'Peace'],
    featured: false,
    active: true,
  },

  // Northeast
  {
    id: 'gangtok',
    name: 'Gangtok & North Sikkim',
    state: 'Sikkim',
    region: 'Northeast',
    description: 'Pristine Himalayan wonderland with Rumtek monastery, Tsomgo glacial lake, Yumthang Valley of Flowers, and Zero Point snowscapes.',
    coverImageUrl: 'https://picsum.photos/seed/gangtok-sikkim/800/600',
    galleryUrls: ['https://picsum.photos/seed/tsomgo-lake/800/600'],
    bestSeason: 'Mar - May & Oct - Dec',
    tags: ['Glacial Lakes', 'Himalayas', 'Flowers', 'Monasteries'],
    featured: true,
    active: true,
  },
  {
    id: 'kaziranga',
    name: 'Kaziranga National Park',
    state: 'Assam',
    region: 'Northeast',
    description: 'UNESCO World Heritage floodplains of the mighty Brahmaputra river, sheltering two-thirds of the world’s great one-horned rhinoceroses.',
    coverImageUrl: 'https://picsum.photos/seed/kaziranga-rhino/800/600',
    galleryUrls: ['https://picsum.photos/seed/assam-brahmaputra/800/600'],
    bestSeason: 'Nov - Apr',
    tags: ['One-Horned Rhino', 'Wildlife', 'Safari', 'Grasslands'],
    featured: false,
    active: true,
  },
  {
    id: 'shillong-cherrapunji',
    name: 'Shillong & Cherrapunji',
    state: 'Meghalaya',
    region: 'Northeast',
    description: 'Scotland of the East featuring living root bridges, thunderous Nohkalikai waterfalls, crystal clear Dawki river, and sacred Khasi groves.',
    coverImageUrl: 'https://picsum.photos/seed/living-root-bridge/800/600',
    galleryUrls: ['https://picsum.photos/seed/dawki-river/800/600'],
    bestSeason: 'Sep - May',
    tags: ['Root Bridges', 'Waterfalls', 'Cleanest Village', 'Rainforest'],
    featured: false,
    active: true,
  },
  {
    id: 'tawang',
    name: 'Tawang',
    state: 'Arunachal Pradesh',
    region: 'Northeast',
    description: 'Majestic high-altitude mountain stronghold in Arunachal Pradesh with India’s largest monastery, high Sela Pass, and roaring Madhuri Lake.',
    coverImageUrl: 'https://picsum.photos/seed/tawang-monastery/800/600',
    galleryUrls: ['https://picsum.photos/seed/sela-pass/800/600'],
    bestSeason: 'Mar - Oct',
    tags: ['High Mountain', 'Monastery', 'Sela Pass', 'Arunachal'],
    featured: false,
    active: true,
  },
  {
    id: 'kohima',
    name: 'Kohima',
    state: 'Nagaland',
    region: 'Northeast',
    description: 'Highland cultural heart of Nagaland, famous for the vibrant Hornbill Festival celebrating indigenous tribal customs, crafts, and music in Kisama.',
    coverImageUrl: 'https://picsum.photos/seed/hornbill-festival-kohima/800/600',
    galleryUrls: ['https://picsum.photos/seed/nagaland-tribal/800/600'],
    bestSeason: 'Oct - May (Hornbill: Dec 1-10)',
    tags: ['Hornbill Festival', 'Tribal Culture', 'Hills', 'Heritage'],
    featured: false,
    active: true,
  },

  // Islands
  {
    id: 'andaman',
    name: 'Andaman (Havelock & Neil)',
    state: 'Andaman & Nicobar UT',
    region: 'Islands',
    description: 'Tropical paradise in the Bay of Bengal with Asia’s finest Radhanagar Beach, vibrant coral reefs, sea scuba diving, and Cellular Jail heritage.',
    coverImageUrl: 'https://picsum.photos/seed/andaman-radhanagar/800/600',
    galleryUrls: ['https://picsum.photos/seed/havelock-scuba/800/600'],
    bestSeason: 'Oct - May',
    tags: ['Islands', 'Scuba Diving', 'Beaches', 'Coral Reefs'],
    featured: true,
    active: true,
  },
  {
    id: 'lakshadweep',
    name: 'Lakshadweep (Agatti & Bangaram)',
    state: 'Lakshadweep UT',
    region: 'Islands',
    description: 'An idyllic archipelago of 36 coral atolls boasting glowing turquoise lagoons, pristine uninhabited islets, kayaking, and reef marine life.',
    coverImageUrl: 'https://picsum.photos/seed/lakshadweep-lagoon/800/600',
    galleryUrls: ['https://picsum.photos/seed/agatti-island/800/600'],
    bestSeason: 'Oct - Apr',
    tags: ['Atolls', 'Turquoise Lagoons', 'Snorkeling', 'Exclusive'],
    featured: false,
    active: true,
  }
];

// 12 Clearly Fictional Partner Agencies
export const DEMO_AGENCIES = [
  {
    id: 'agency-himalayan-horizons',
    name: 'Himalayan Horizons Expeditions',
    logoUrl: 'https://picsum.photos/seed/agency-himalayas/200/200',
    description: 'Specialists in high-altitude treks, mountain safaris, and pilgrimage circuits across Ladakh, Spiti, Himachal, and Kashmir with expert local sherpas.',
    tier: 'premium',
    rating: 4.9,
    verified: true,
    phone: '+91 90000 00001',
    email: 'contact@himalayan-horizons.example.com',
    city: 'Manali',
    commissionPercent: 12,
    active: true,
  },
  {
    id: 'agency-royal-rajputana',
    name: 'Royal Rajputana Heritage Journeys',
    logoUrl: 'https://picsum.photos/seed/agency-rajputana/200/200',
    description: 'Curating palace stays, desert camel glamping, and private royal haveli tours across Jaipur, Udaipur, Jaisalmer, and Jodhpur.',
    tier: 'premium',
    rating: 4.8,
    verified: true,
    phone: '+91 90000 00002',
    email: 'tours@royal-rajputana.example.com',
    city: 'Jaipur',
    commissionPercent: 14,
    active: true,
  },
  {
    id: 'agency-kerala-breezes',
    name: 'Kerala Breezes & Backwaters',
    logoUrl: 'https://picsum.photos/seed/agency-kerala/200/200',
    description: 'Traditional kettuvallam houseboats, tea estate retreats, and authentic Ayurveda wellness packages across Alleppey, Munnar, and Kochi.',
    tier: 'standard',
    rating: 4.7,
    verified: true,
    phone: '+91 90000 00003',
    email: 'info@keralabreezes.example.com',
    city: 'Kochi',
    commissionPercent: 10,
    active: true,
  },
  {
    id: 'agency-sunwave-goa',
    name: 'Sunwave Coastal Travels',
    logoUrl: 'https://picsum.photos/seed/agency-sunwave/200/200',
    description: 'Goa and Konkan beach specialists offering luxury villas, dolphin cruises, water sports adventures, and private yacht charters.',
    tier: 'budget',
    rating: 4.3,
    verified: true,
    phone: '+91 90000 00004',
    email: 'bookings@sunwavetravels.example.com',
    city: 'Panaji',
    commissionPercent: 9,
    active: true,
  },
  {
    id: 'agency-northeast-trails',
    name: 'Seven Sisters Pioneer Trails',
    logoUrl: 'https://picsum.photos/seed/agency-northeast/200/200',
    description: 'Unlocking raw Northeast India from the living root bridges of Meghalaya to Kaziranga rhino safaris and Tawang mountain passes.',
    tier: 'standard',
    rating: 4.6,
    verified: true,
    phone: '+91 90000 00005',
    email: 'explore@sevensisterstrails.example.com',
    city: 'Guwahati',
    commissionPercent: 11,
    active: true,
  },
  {
    id: 'agency-bengal-voyagers',
    name: 'Bengal Voyagers & Delta Safaris',
    logoUrl: 'https://picsum.photos/seed/agency-bengal/200/200',
    description: 'Specialists in Eastern India, Darjeeling Himalayan tea plantations, Kolkata heritage walks, and Sundarbans mangrove tiger boat safaris.',
    tier: 'budget',
    rating: 4.2,
    verified: false,
    phone: '+91 90000 00006',
    email: 'tours@bengalvoyagers.example.com',
    city: 'Kolkata',
    commissionPercent: 8,
    active: true,
  },
  {
    id: 'agency-island-paradise',
    name: 'Emerald Isles Coral Holidays',
    logoUrl: 'https://picsum.photos/seed/agency-islands/200/200',
    description: 'Certified PADI scuba diving tours, luxury catamaran cruises, and beachside resort vacations across Andaman and Lakshadweep.',
    tier: 'premium',
    rating: 4.9,
    verified: true,
    phone: '+91 90000 00007',
    email: 'aloha@emeraldisles.example.com',
    city: 'Port Blair',
    commissionPercent: 15,
    active: true,
  },
  {
    id: 'agency-deccan-wonders',
    name: 'Deccan Wonders & Temple Escapes',
    logoUrl: 'https://picsum.photos/seed/agency-deccan/200/200',
    description: 'Architectural circuits across Southern empires: Hampi boulders, Madurai gopurams, Mysore royal palaces, and ancient temple corridors.',
    tier: 'standard',
    rating: 4.5,
    verified: true,
    phone: '+91 90000 00008',
    email: 'yatra@deccanwonders.example.com',
    city: 'Bengaluru',
    commissionPercent: 10,
    active: true,
  },
  {
    id: 'agency-wild-india',
    name: 'Wild Heartland Jungle Safaris',
    logoUrl: 'https://picsum.photos/seed/agency-wildlife/200/200',
    description: 'Wildlife conservation safaris, naturalist-guided tiger tracks, and eco-lodges across Kanha, Gir, Jim Corbett, and Kaziranga.',
    tier: 'premium',
    rating: 4.7,
    verified: true,
    phone: '+91 90000 00009',
    email: 'safari@wildheartland.example.com',
    city: 'Nagpur',
    commissionPercent: 13,
    active: true,
  },
  {
    id: 'agency-ganga-moksha',
    name: 'Sacred Ganga Pilgrimage & Wellness',
    logoUrl: 'https://picsum.photos/seed/agency-pilgrim/200/200',
    description: 'Spiritual journeys and yoga retreats covering Varanasi ghats, Rishikesh ashrams, Haridwar aartis, and Bodh Gaya meditation groves.',
    tier: 'budget',
    rating: 4.4,
    verified: true,
    phone: '+91 90000 00010',
    email: 'seva@sacredganga.example.com',
    city: 'Varanasi',
    commissionPercent: 9,
    active: true,
  },
  {
    id: 'agency-maratha-roads',
    name: 'Maratha Escapes & Coastal Ways',
    logoUrl: 'https://picsum.photos/seed/agency-maharashtra/200/200',
    description: 'Western Ghats hill station treks, Ajanta & Ellora cave architecture tours, and vibrant Mumbai coastal heritage experiences.',
    tier: 'budget',
    rating: 3.9,
    verified: false,
    phone: '+91 90000 00011',
    email: 'help@marathaescapes.example.com',
    city: 'Pune',
    commissionPercent: 8,
    active: true,
  },
  {
    id: 'agency-bharat-yatri',
    name: 'Bharat Yatri Value Tours',
    logoUrl: 'https://picsum.photos/seed/agency-value/200/200',
    description: 'Affordable, well-organized pan-India group tours and Volvo bus packages designed for families, seniors, and budget-conscious explorers.',
    tier: 'budget',
    rating: 3.8,
    verified: true,
    phone: '+91 90000 00012',
    email: 'support@bharatyatri.example.com',
    city: 'New Delhi',
    commissionPercent: 8,
    active: true,
  }
];

// Helper to generate packages and departures
export function generatePackagesAndDepartures() {
  const packages: any[] = [];
  const departures: any[] = [];

  // Popular destinations getting 3-4 packages from DIFFERENT agencies
  const popularDestinations = [
    'goa', 'alleppey', 'munnar', 'jaipur', 'udaipur', 'agra',
    'varanasi', 'kashmir', 'leh-ladakh', 'manali', 'darjeeling',
    'gangtok', 'andaman', 'rishikesh'
  ];

  let packageCounter = 1;

  for (const dest of DEMO_DESTINATIONS) {
    const isPopular = popularDestinations.includes(dest.id);
    const count = isPopular ? 3 : 1;

    for (let i = 0; i < count; i++) {
      const packageId = `pkg-${dest.id}-${i + 1}`;
      
      // Select appropriate agencies based on region or tier
      let agency = DEMO_AGENCIES[0];
      if (dest.region === 'North') {
        agency = [DEMO_AGENCIES[0], DEMO_AGENCIES[9], DEMO_AGENCIES[11], DEMO_AGENCIES[8]][i % 4];
      } else if (dest.region === 'West') {
        agency = [DEMO_AGENCIES[1], DEMO_AGENCIES[3], DEMO_AGENCIES[10], DEMO_AGENCIES[8]][i % 4];
      } else if (dest.region === 'South') {
        agency = [DEMO_AGENCIES[2], DEMO_AGENCIES[7], DEMO_AGENCIES[11]][i % 3];
      } else if (dest.region === 'East') {
        agency = [DEMO_AGENCIES[5], DEMO_AGENCIES[9], DEMO_AGENCIES[11]][i % 3];
      } else if (dest.region === 'Northeast') {
        agency = [DEMO_AGENCIES[4], DEMO_AGENCIES[5], DEMO_AGENCIES[0]][i % 3];
      } else if (dest.region === 'Islands') {
        agency = [DEMO_AGENCIES[6], DEMO_AGENCIES[3], DEMO_AGENCIES[2]][i % 3];
      } else {
        agency = [DEMO_AGENCIES[8], DEMO_AGENCIES[9], DEMO_AGENCIES[11]][i % 3];
      }

      // Vary days, price, and specs per agency tier / iteration
      const days = isPopular ? (i === 0 ? 4 : i === 1 ? 6 : 8) : (dest.region === 'North' || dest.region === 'Islands' ? 6 : 4);
      const nights = days - 1;

      // Pricing logic based on tier and destination
      let basePrice = 12000;
      if (agency.tier === 'budget') basePrice = 8500 + i * 2000;
      if (agency.tier === 'standard') basePrice = 18000 + i * 4000;
      if (agency.tier === 'premium') basePrice = 32000 + i * 8000;
      if (dest.id === 'leh-ladakh' || dest.id === 'andaman' || dest.id === 'lakshadweep') {
        basePrice = Math.round(basePrice * 1.5);
      }

      // Title variations
      let title = `${dest.name} Discovery - ${days}D/${nights}N`;
      if (i === 1) title = `Luxury ${dest.name} Experience & Highlights`;
      if (i === 2) title = `Grand ${dest.name} Complete Holiday Circuit`;

      // Vehicle appropriate to region & tier
      let vehicleType = 'Sedan';
      let vehicleName = 'Maruti Suzuki Dzire AC';
      let ac = true;
      let seatingCapacity = 4;
      let vehicleDetails = 'Private air-conditioned sedan with experienced commercial chauffeur for transfers and sightseeing.';
      
      if (dest.region === 'North' && (dest.id === 'leh-ladakh' || dest.id === 'spiti-valley' || dest.id === 'kashmir')) {
        vehicleType = agency.tier === 'premium' ? '4x4 Jeep' : 'Tempo Traveller';
        vehicleName = agency.tier === 'premium' ? 'Toyota Fortuner 4x4' : 'Force Urbania Tempo Traveller';
        seatingCapacity = agency.tier === 'premium' ? 6 : 12;
        vehicleDetails = 'All-terrain vehicle with high ground clearance, snow chains, and skilled mountain certified driver.';
      } else if (dest.id === 'alleppey') {
        vehicleType = i === 1 ? 'Boat/Houseboat' : 'SUV';
        vehicleName = i === 1 ? 'Deluxe Traditional Kerala Kettuvallam' : 'Toyota Innova Crysta';
        seatingCapacity = i === 1 ? 6 : 7;
        vehicleDetails = i === 1 ? 'Handcrafted wooden houseboat cruising palm canals with captain, chef and engine master.' : 'Premium AC SUV with dedicated airport pickup.';
      } else if (agency.tier === 'premium') {
        vehicleType = 'SUV';
        vehicleName = 'Toyota Innova Crysta AC';
        seatingCapacity = 6;
        vehicleDetails = 'Luxury captain seat SUV with bottled water, tissue boxes, mobile chargers, and professional uniformed chauffeur.';
      } else if (agency.tier === 'budget') {
        vehicleType = 'Tempo Traveller';
        vehicleName = 'AC Tempo Traveller 12-Seater';
        seatingCapacity = 12;
        vehicleDetails = 'Comfortable group pushback seats with AC and audio entertainment system.';
      }

      // Food appropriate to region
      let mealPlan = agency.tier === 'budget' ? 'Breakfast only' : (agency.tier === 'standard' ? 'Breakfast + Dinner' : 'All meals');
      let cuisine = 'Veg & Non-veg';
      let foodDetails = 'Daily buffet breakfast at hotels. Dinners include regional delicacies.';
      if (dest.region === 'North' && dest.id === 'kashmir') {
        foodDetails = 'Authentic Kashmiri wazwan dinner (Rogan Josh, Gushtaba, Dum Aloo) and morning Kahwa saffron tea with freshly baked bread.';
      } else if (dest.region === 'West' && (dest.id === 'jaipur' || dest.id === 'udaipur' || dest.id === 'jaisalmer')) {
        cuisine = 'Veg';
        foodDetails = 'Traditional Rajasthani thali featuring Dal Baati Churma, Gatte ki Sabzi, Ker Sangri, and warm Ghewar desserts.';
      } else if (dest.id === 'goa') {
        foodDetails = 'Goan coastal curries with fresh kingfish, butter garlic prawns, bebinca dessert, plus extensive continental breakfast.';
      } else if (dest.region === 'South' && (dest.id === 'alleppey' || dest.id === 'kochi' || dest.id === 'munnar')) {
        foodDetails = 'Kerala Sadhya feast served on banana leaf, Appam with vegetable stew or fish molee, and filter coffee.';
      } else if (dest.region === 'East' && (dest.id === 'darjeeling' || dest.id === 'kolkata')) {
        foodDetails = 'Darjeeling first flush tea tastings, steaming momos, thukpa, Bengali fish curry (macher jhol), and warm roshogollas.';
      }

      // Hotel appropriate
      let hotelCategory = agency.tier === 'budget' ? '3-star' : (agency.tier === 'standard' ? '4-star' : '5-star');
      let hotelName = `${dest.name.split(' ')[0]} Grand Hotel`;
      let roomType = 'Deluxe Air-Conditioned Room';
      let occupancy = 'Double sharing';
      let amenities = ['Free High-Speed Wi-Fi', 'Complimentary Breakfast', 'Swimming Pool', '24/7 Room Service', 'Power Backup'];
      
      if (dest.id === 'alleppey' && i === 1) {
        hotelCategory = 'Houseboat';
        hotelName = 'Punnamada Luxury Kettuvallam';
        roomType = 'Upper Deck King Suite with AC';
        amenities = ['Air Conditioning', 'Sundeck Dining', 'Private Chef', 'Fishing Rods'];
      } else if ((dest.id === 'jaipur' || dest.id === 'udaipur') && agency.tier === 'premium') {
        hotelCategory = 'Heritage';
        hotelName = 'Chhotu Singh Haveli & Palace';
        roomType = 'Royal Jharokha Suite';
        amenities = ['Heritage Courtyard', 'Folk Dance Evening', 'Ayurvedic Spa', 'Swimming Pool', 'Antique Furnishings'];
      } else if (dest.id === 'jaisalmer' && i === 1) {
        hotelCategory = 'Camp';
        hotelName = 'Sam Sand Dunes Luxury Desert Camp';
        roomType = 'Royal Swiss Air-Conditioned Tent';
        amenities = ['Attached Ceramic Bathroom', 'Campfire Evening', 'Rajasthani Folk Show', 'Star Gazing Deck'];
      }

      // Build daily itinerary
      const itinerary = [];
      for (let d = 1; d <= days; d++) {
        if (d === 1) {
          itinerary.push({
            day: 1,
            title: `Arrival at ${dest.name} & Welcome Check-in`,
            details: `Airport/railway pickup by private representative. Check-in at ${hotelName}. Evening at leisure exploring the surrounding local bazaars.`
          });
        } else if (d === days) {
          itinerary.push({
            day: d,
            title: `Souvenir Shopping & Departure`,
            details: `Hearty morning breakfast. Time for photo opportunities and local handicraft shopping. Chauffeur transfer to the airport or train station.`
          });
        } else {
          itinerary.push({
            day: d,
            title: `Day ${d}: Highlights Sightseeing & Heritage Exploration`,
            details: `Comprehensive guided excursion covering prominent temples, scenic viewpoints, local cuisine tasting, and cultural photography.`
          });
        }
      }

      const pkg = {
        id: packageId,
        agencyId: agency.id,
        destinationId: dest.id,
        title,
        days,
        nights,
        pricePerPerson: basePrice,
        inclusions: [
          `${nights} Nights accommodation at ${hotelCategory} property`,
          `Daily ${mealPlan} as per itinerary`,
          `All transfers and sightseeing by private ${vehicleType} (${vehicleName})`,
          'State taxes, toll taxes, fuel charges, and driver allowances',
          'Professional English/Hindi speaking tour escort for guided monuments'
        ],
        exclusions: [
          'Airfare or train fare to/from origin city',
          'Monument entrance fees and camera charges',
          'Personal expenses like laundry, minibar, telephone calls',
          'Adventure sports tickets (river rafting, paragliding, scuba gear)',
          'Mandatory 5% GST'
        ],
        itinerary,
        cancellationPolicy: 'Full refund if cancelled 15+ days prior to departure. 50% refund 7-14 days prior. Non-refundable within 7 days of travel date.',
        maxGroupSize: agency.tier === 'premium' ? 12 : (agency.tier === 'standard' ? 20 : 35),
        imageUrls: [
          dest.coverImageUrl,
          `https://picsum.photos/seed/pkg-${packageId}-1/800/600`,
          `https://picsum.photos/seed/pkg-${packageId}-2/800/600`
        ],
        rating: Math.round((4.0 + Math.random() * 0.9) * 10) / 10,
        active: true,
        vehicle: {
          type: vehicleType,
          vehicleName,
          ac,
          seatingCapacity,
          stationOrAirportPickup: true,
          details: vehicleDetails,
          imageUrl: `https://picsum.photos/seed/veh-${packageId}/800/600`,
        },
        food: {
          mealPlan,
          cuisine,
          jainOnRequest: true,
          details: foodDetails,
        },
        hotel: {
          hotelName,
          category: hotelCategory,
          roomType,
          occupancy,
          amenities,
          details: `Premium property situated near central tourist attractions with scenic views, pristine housekeeping, and dedicated guest concierge.`,
          imageUrls: [`https://picsum.photos/seed/hotel-${packageId}/800/600`],
        },
        isDemo: true,
      };

      packages.push(pkg);
      packageCounter++;

      // Create 6 to 10 departures per package over next 90 days
      const departureCount = 7;
      const today = new Date('2026-10-03');
      for (let depIdx = 0; depIdx < departureCount; depIdx++) {
        const depDate = new Date(today);
        depDate.setDate(today.getDate() + 5 + depIdx * 11);
        const depDateStr = depDate.toISOString().split('T')[0];

        const seatsTotal = agency.tier === 'premium' ? 14 : (agency.tier === 'standard' ? 24 : 36);
        let seatsBooked = 0;
        let seatsHeld = 0;
        let status = 'open';

        // Mix of statuses
        if (depIdx === 0) {
          seatsBooked = seatsTotal;
          status = 'full';
        } else if (depIdx === 1) {
          seatsBooked = seatsTotal - 3;
          seatsHeld = 1;
          status = 'limited';
        } else if (depIdx === 2) {
          seatsBooked = Math.floor(seatsTotal * 0.4);
          status = 'open';
        } else if (depIdx === 3) {
          status = 'closed';
        } else {
          seatsBooked = Math.floor(seatsTotal * 0.2);
          status = 'open';
        }

        const departureId = `dep-${packageId}-${depIdx + 1}`;
        departures.push({
          id: departureId,
          packageId: pkg.id,
          agencyId: agency.id,
          destinationId: dest.id,
          date: depDateStr,
          seatsTotal,
          seatsBooked,
          seatsHeld,
          priceOverride: depIdx === 1 ? Math.round(basePrice * 1.1) : undefined,
          status,
          isDemo: true,
        });
      }
    }
  }

  return { packages, departures };
}

// 4 Fake Customers
export const DEMO_CUSTOMERS = [
  {
    uid: 'demo-cust-arjun',
    name: 'Arjun Sharma',
    phone: '+91 98201 11223',
    email: 'arjun.sharma@example.com',
    createdAt: '2026-09-01T10:00:00.000Z',
    isDemo: true,
  },
  {
    uid: 'demo-cust-priya',
    name: 'Priya Iyer',
    phone: '+91 97412 33445',
    email: 'priya.iyer@example.com',
    createdAt: '2026-09-05T14:30:00.000Z',
    isDemo: true,
  },
  {
    uid: 'demo-cust-rohit',
    name: 'Rohit Deshmukh',
    phone: '+91 99870 55667',
    email: 'rohit.deshmukh@example.com',
    createdAt: '2026-09-12T09:15:00.000Z',
    isDemo: true,
  },
  {
    uid: 'demo-cust-ananya',
    name: 'Ananya Mukherjee',
    phone: '+91 98300 77889',
    email: 'ananya.m@example.com',
    createdAt: '2026-09-18T16:45:00.000Z',
    isDemo: true,
  }
];

// 15 Demo Bookings across all statuses (held, confirmed, completed, cancelled, refunded)
export function generateDemoBookings(packages: any[], departures: any[]) {
  const statuses: Array<'held' | 'confirmed' | 'completed' | 'cancelled' | 'refunded'> = [
    'confirmed', 'confirmed', 'confirmed', 'confirmed',
    'completed', 'completed', 'completed',
    'held', 'held',
    'cancelled', 'cancelled',
    'refunded', 'refunded',
    'confirmed', 'completed'
  ];

  const bookings: any[] = [];
  const customers = DEMO_CUSTOMERS;

  for (let i = 0; i < 15; i++) {
    const pkg = packages[i % packages.length];
    const dep = departures.find((d: any) => d.packageId === pkg.id) || departures[0];
    const cust = customers[i % customers.length];
    const st = statuses[i];
    const numTravelers = 2 + (i % 3);

    const price = dep.priceOverride || pkg.pricePerPerson;
    const totalAmount = price * numTravelers;
    const commissionPercent = 10;
    const commissionAmount = Math.round((totalAmount * commissionPercent) / 100);

    const travelers = [
      { name: cust.name, age: 32 + (i % 10) },
      { name: `Traveler ${i + 1}B`, age: 28 + (i % 8) },
    ];
    if (numTravelers > 2) {
      travelers.push({ name: `Child ${i + 1}C`, age: 8 + (i % 6) });
    }

    let paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' = 'paid';
    let holdExpiresAt: string | undefined = undefined;
    let agencyPayoutStatus: 'pending' | 'settled' = 'pending';

    if (st === 'held') {
      paymentStatus = 'pending';
      const exp = new Date('2026-10-03T03:15:00.000Z');
      holdExpiresAt = exp.toISOString();
    } else if (st === 'refunded') {
      paymentStatus = 'refunded';
    } else if (st === 'cancelled') {
      paymentStatus = 'failed';
    } else if (st === 'completed') {
      agencyPayoutStatus = 'settled';
    }

    const bookingId = `book-demo-${1000 + i}`;
    bookings.push({
      id: bookingId,
      bookingCode: `TM-${202600 + i}`,
      customerId: cust.uid,
      packageId: pkg.id,
      agencyId: pkg.agencyId,
      destinationId: pkg.destinationId,
      departureId: dep.id,
      travelDate: dep.date,
      travelers,
      totalAmount,
      commissionAmount,
      status: st,
      paymentStatus,
      razorpayOrderId: `order_demo_${100000 + i}`,
      razorpayPaymentId: st === 'confirmed' || st === 'completed' ? `pay_demo_${200000 + i}` : undefined,
      holdExpiresAt,
      agencyPayoutStatus,
      notes: i === 0 ? 'Customer requested vegetarian Jain meals on day 2.' : (i === 3 ? 'Airport transfer requested for 6 AM flight.' : ''),
      createdAt: new Date(Date.now() - (15 - i) * 86400000).toISOString(),
      isDemo: true,
    });
  }

  return bookings;
}

// 5 Demo Chats (2 bot, 2 waiting_for_staff with message history, 1 closed)
export const DEMO_CHATS = [
  {
    id: 'chat-demo-1',
    customerId: 'demo-cust-arjun',
    mode: 'bot',
    status: 'open',
    lastMessage: 'All our Kashmir packages include shikara rides on Dal Lake and heated room facilities.',
    lastMessageAt: '2026-10-03T02:10:00.000Z',
    isDemo: true,
    messages: [
      { id: 'm1', sender: 'customer', text: 'Hi, does the Kashmir 5-day tour include shikara rides?', createdAt: '2026-10-03T02:08:00.000Z' },
      { id: 'm2', sender: 'bot', text: 'Hello Arjun! Yes, all our Kashmir discovery packages include a complimentary 1-hour sunset shikara ride on Dal Lake along with houseboats stays. Would you like to see available departure dates?', createdAt: '2026-10-03T02:10:00.000Z' }
    ]
  },
  {
    id: 'chat-demo-2',
    customerId: 'demo-cust-priya',
    mode: 'human',
    status: 'waiting_for_staff',
    lastMessage: 'Can you please connect me with a human agent? We are traveling with a senior citizen in a wheelchair.',
    lastMessageAt: '2026-10-03T02:25:00.000Z',
    isDemo: true,
    messages: [
      { id: 'm1', sender: 'customer', text: 'Hello, looking at the Munnar-Alleppey package.', createdAt: '2026-10-03T02:20:00.000Z' },
      { id: 'm2', sender: 'bot', text: 'Greetings Priya! Our Munnar & Alleppey tour includes private Innova transfers, tea garden visits, and an overnight houseboat stay.', createdAt: '2026-10-03T02:21:00.000Z' },
      { id: 'm3', sender: 'customer', text: 'Can you please connect me with a human agent? We are traveling with a senior citizen in a wheelchair and need accessible vehicle details.', createdAt: '2026-10-03T02:25:00.000Z' },
      { id: 'm4', sender: 'bot', text: 'Certainly! I have routed your query to our support team. A staff member will reply shortly. Support hours: Mon-Sat 9:00 AM - 8:00 PM IST. Phone: +91 1800 200 4567.', createdAt: '2026-10-03T02:25:05.000Z' }
    ]
  },
  {
    id: 'chat-demo-3',
    customerId: 'demo-cust-rohit',
    mode: 'human',
    status: 'waiting_for_staff',
    lastMessage: 'Hi staff, can we customize the Ladakh trip to include 2 nights at Nubra instead of 1?',
    lastMessageAt: '2026-10-03T01:50:00.000Z',
    isDemo: true,
    messages: [
      { id: 'm1', sender: 'customer', text: 'I need to speak to staff about Leh-Ladakh customizations.', createdAt: '2026-10-03T01:48:00.000Z' },
      { id: 'm2', sender: 'customer', text: 'Hi staff, can we customize the Ladakh trip to include 2 nights at Nubra instead of 1?', createdAt: '2026-10-03T01:50:00.000Z' }
    ]
  },
  {
    id: 'chat-demo-4',
    customerId: 'demo-cust-ananya',
    mode: 'bot',
    status: 'open',
    lastMessage: 'The best season to visit Andaman is between October and May for calm seas and excellent scuba visibility.',
    lastMessageAt: '2026-10-02T18:30:00.000Z',
    isDemo: true,
    messages: [
      { id: 'm1', sender: 'customer', text: 'What is the best month to visit Havelock and Neil islands?', createdAt: '2026-10-02T18:28:00.000Z' },
      { id: 'm2', sender: 'bot', text: 'The best season to visit Andaman is between October and May for calm seas and excellent scuba visibility.', createdAt: '2026-10-02T18:30:00.000Z' }
    ]
  },
  {
    id: 'chat-demo-5',
    customerId: 'demo-cust-arjun',
    mode: 'human',
    status: 'closed',
    assignedStaffId: 'staff-owner',
    lastMessage: 'Thank you for your help, invoice received.',
    lastMessageAt: '2026-10-01T15:20:00.000Z',
    isDemo: true,
    messages: [
      { id: 'm1', sender: 'customer', text: 'Could you resend my GST invoice for TM-202601?', createdAt: '2026-10-01T15:10:00.000Z' },
      { id: 'm2', sender: 'staff', text: 'Hello Arjun, we have sent the tax invoice copy directly to arjun.sharma@example.com.', createdAt: '2026-10-01T15:15:00.000Z' },
      { id: 'm3', sender: 'customer', text: 'Thank you for your help, invoice received.', createdAt: '2026-10-01T15:20:00.000Z' }
    ]
  }
];

// 4 Callback Requests
export const DEMO_CALLBACK_REQUESTS = [
  {
    id: 'cb-demo-1',
    customerId: 'demo-cust-arjun',
    name: 'Arjun Sharma',
    phone: '+91 98201 11223',
    topic: 'Corporate group booking of 18 people for Goa in November',
    status: 'new',
    createdAt: '2026-10-03T02:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'cb-demo-2',
    customerId: 'demo-cust-priya',
    name: 'Priya Iyer',
    phone: '+91 97412 33445',
    topic: 'Elderly assistance and wheelchair accessible houseboat in Alleppey',
    status: 'new',
    createdAt: '2026-10-03T01:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'cb-demo-3',
    customerId: 'demo-cust-rohit',
    name: 'Rohit Deshmukh',
    phone: '+91 99870 55667',
    topic: 'Bike rental details and permits for Leh-Ladakh circuit',
    status: 'called',
    createdAt: '2026-10-02T14:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'cb-demo-4',
    customerId: 'demo-cust-ananya',
    name: 'Ananya Mukherjee',
    phone: '+91 98300 77889',
    topic: 'Honeymoon candle-light dinner on beach in Havelock',
    status: 'closed',
    createdAt: '2026-10-01T11:00:00.000Z',
    isDemo: true,
  }
];

// Demo Company Settings
export const DEMO_COMPANY_SETTINGS = {
  companyName: 'Tour Manage India Pvt. Ltd.',
  supportPhones: ['+91 1800 200 4567', '+91 98200 98200'],
  supportEmail: 'support@tourmanage.com',
  supportHours: 'Monday - Saturday: 9:00 AM - 8:00 PM IST (Emergency 24x7)',
  whatsappNumber: '+91 98200 98200',
  aboutText: 'Tour Manage is India’s premier unified holiday marketplace. We handpick trusted, boutique local tour agencies from every corner of India—from the snow-draped passes of Ladakh to the serene backwaters of Kerala—bringing their regional expertise under our verified company banner with guaranteed quality, transparent pricing, and 24/7 on-ground assistance.',
  termsUrl: 'https://tourmanage.com/terms-and-cancellation',
  isDemo: true,
};

// Demo Support Staff Credentials
export const DEMO_SUPPORT_USER = {
  email: 'demo-support@tourmanage.test',
  password: 'Demo@12345',
  name: 'Demo Support Staff',
  role: 'support' as const,
};

/**
 * Executes full server-side seeding with idempotent batch writes
 */
export async function seedDemoData() {
  console.log('Starting full demo data seed...');

  // 1. Destinations
  const destBatch = adminDb.batch();
  for (const dest of DEMO_DESTINATIONS) {
    const ref = adminDb.collection('destinations').doc(dest.id);
    destBatch.set(ref, { ...dest, isDemo: true }, { merge: true });
  }
  await destBatch.commit();
  console.log(`Seeded ${DEMO_DESTINATIONS.length} destinations.`);

  // 2. Agencies
  const agencyBatch = adminDb.batch();
  for (const agency of DEMO_AGENCIES) {
    const ref = adminDb.collection('agencies').doc(agency.id);
    agencyBatch.set(ref, { ...agency, isDemo: true }, { merge: true });
  }
  await agencyBatch.commit();
  console.log(`Seeded ${DEMO_AGENCIES.length} agencies.`);

  // 3. Packages and Departures
  const { packages, departures } = generatePackagesAndDepartures();
  console.log(`Generated ${packages.length} packages and ${departures.length} departures.`);

  // Commit packages in batches of 400
  for (let i = 0; i < packages.length; i += 400) {
    const batch = adminDb.batch();
    const slice = packages.slice(i, i + 400);
    for (const pkg of slice) {
      batch.set(adminDb.collection('packages').doc(pkg.id), pkg, { merge: true });
    }
    await batch.commit();
  }
  console.log(`Seeded ${packages.length} packages.`);

  // Commit departures in batches of 400
  for (let i = 0; i < departures.length; i += 400) {
    const batch = adminDb.batch();
    const slice = departures.slice(i, i + 400);
    for (const dep of slice) {
      batch.set(adminDb.collection('departures').doc(dep.id), dep, { merge: true });
    }
    await batch.commit();
  }
  console.log(`Seeded ${departures.length} departures.`);

  // 4. Customers
  const custBatch = adminDb.batch();
  for (const cust of DEMO_CUSTOMERS) {
    custBatch.set(adminDb.collection('customers').doc(cust.uid), cust, { merge: true });
  }
  await custBatch.commit();

  // 5. Bookings
  const demoBookings = generateDemoBookings(packages, departures);
  const bookBatch = adminDb.batch();
  for (const book of demoBookings) {
    bookBatch.set(adminDb.collection('bookings').doc(book.id), book, { merge: true });
  }
  await bookBatch.commit();
  console.log(`Seeded ${demoBookings.length} bookings.`);

  // 6. Chats and subcollection messages
  for (const chat of DEMO_CHATS) {
    const { messages, ...chatData } = chat;
    await adminDb.collection('chats').doc(chat.id).set(chatData, { merge: true });
    const msgBatch = adminDb.batch();
    for (const m of messages) {
      const mRef = adminDb.collection('chats').doc(chat.id).collection('messages').doc(m.id);
      msgBatch.set(mRef, { ...m, isDemo: true }, { merge: true });
    }
    await msgBatch.commit();
  }
  console.log(`Seeded ${DEMO_CHATS.length} chats with messages.`);

  // 7. Callback Requests
  const cbBatch = adminDb.batch();
  for (const cb of DEMO_CALLBACK_REQUESTS) {
    cbBatch.set(adminDb.collection('callbackRequests').doc(cb.id), cb, { merge: true });
  }
  await cbBatch.commit();

  // 8. Settings
  await adminDb.collection('settings').doc('company').set(DEMO_COMPANY_SETTINGS, { merge: true });

  // 9. Demo Support Staff User
  try {
    let supportUser;
    try {
      supportUser = await adminAuth.getUserByEmail(DEMO_SUPPORT_USER.email);
    } catch {
      supportUser = await adminAuth.createUser({
        email: DEMO_SUPPORT_USER.email,
        password: DEMO_SUPPORT_USER.password,
        displayName: DEMO_SUPPORT_USER.name,
      });
    }

    // Set custom claim
    await adminAuth.setCustomUserClaims(supportUser.uid, { role: 'support' });

    // Save staff doc
    await adminDb.collection('staff').doc(supportUser.uid).set({
      name: DEMO_SUPPORT_USER.name,
      email: DEMO_SUPPORT_USER.email,
      role: 'support',
      active: true,
      isDemo: true,
    }, { merge: true });

    console.log(`Configured demo support staff user: ${DEMO_SUPPORT_USER.email}`);
  } catch (err) {
    console.error('Error creating demo support staff:', err);
  }

  return {
    success: true,
    destinationsCount: DEMO_DESTINATIONS.length,
    agenciesCount: DEMO_AGENCIES.length,
    packagesCount: packages.length,
    departuresCount: departures.length,
    bookingsCount: demoBookings.length,
    supportLogin: {
      email: DEMO_SUPPORT_USER.email,
      password: DEMO_SUPPORT_USER.password,
      role: DEMO_SUPPORT_USER.role,
    }
  };
}

/**
 * Deletes all documents marked with isDemo: true across all collections
 */
export async function deleteDemoData() {
  console.log('Cleaning up all demo data...');
  const collections = [
    'destinations',
    'agencies',
    'packages',
    'departures',
    'customers',
    'bookings',
    'chats',
    'callbackRequests',
    'staff',
  ];

  let deletedTotal = 0;

  for (const col of collections) {
    const snap = await adminDb.collection(col).where('isDemo', '==', true).get();
    if (snap.empty) continue;

    for (const doc of snap.docs) {
      // If chat, delete subcollection messages first
      if (col === 'chats') {
        const msgSnap = await doc.ref.collection('messages').get();
        const msgBatch = adminDb.batch();
        for (const m of msgSnap.docs) {
          msgBatch.delete(m.ref);
        }
        await msgBatch.commit();
      }
      await doc.ref.delete();
      deletedTotal++;
    }
  }

  // Remove demo company settings
  const settingsDoc = await adminDb.collection('settings').doc('company').get();
  if (settingsDoc.exists && settingsDoc.data()?.isDemo) {
    await settingsDoc.ref.delete();
    deletedTotal++;
  }

  // Delete demo support staff auth account
  try {
    const user = await adminAuth.getUserByEmail(DEMO_SUPPORT_USER.email);
    if (user) {
      await adminAuth.deleteUser(user.uid);
      console.log(`Deleted demo support user ${DEMO_SUPPORT_USER.email}`);
    }
  } catch {
    // User might not exist or already deleted
  }

  console.log(`Deleted total ${deletedTotal} demo records.`);
  return { success: true, deletedTotal };
}
