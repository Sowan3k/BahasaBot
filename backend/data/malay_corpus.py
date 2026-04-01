"""
Malay Language RAG Corpus

60+ semantic chunks of Bahasa Melayu knowledge for the vector store.
Each chunk covers: grammar rules, vocabulary groups, or cultural notes.
Metadata: {type: grammar|vocabulary|culture, level: A1|A2|B1|B2, topic: str}

Ingested automatically on first app startup if the documents table is empty.
"""

MALAY_CORPUS: list[dict] = [
    # ── Greetings & Farewells (A1) ─────────────────────────────────────────────
    {
        "content": (
            "Common Malay greetings: 'Selamat pagi' means good morning. "
            "'Selamat tengah hari' means good afternoon (around noon). "
            "'Selamat petang' means good evening (late afternoon). "
            "'Selamat malam' means good night. "
            "'Selamat sejahtera' is a formal all-purpose greeting. "
            "'Apa khabar?' means 'How are you?' and the reply is 'Khabar baik' (I am well) or 'Baik, terima kasih' (Fine, thank you). "
            "'Selamat tinggal' is said by the person leaving; 'Selamat jalan' is said to the person departing. "
            "Example: 'Selamat pagi! Apa khabar?' — 'Khabar baik, terima kasih.'"
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "greetings"},
    },
    # ── Introductions (A1) ─────────────────────────────────────────────────────
    {
        "content": (
            "Introducing yourself in Malay: 'Nama saya [name]' means 'My name is [name]'. "
            "'Saya dari [country/city]' means 'I am from [country/city]'. "
            "'Saya belajar di [university]' means 'I study at [university]'. "
            "'Berapa umur awak?' means 'How old are you?' "
            "'Umur saya dua puluh tahun' means 'I am twenty years old'. "
            "'Saya pelajar antarabangsa' means 'I am an international student'. "
            "'Senang berkenalan dengan awak' means 'Nice to meet you'. "
            "Example: 'Nama saya Ali. Saya dari Korea. Umur saya dua puluh dua tahun.'"
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "introductions"},
    },
    # ── Pronouns (A1) ─────────────────────────────────────────────────────────
    {
        "content": (
            "Malay personal pronouns: "
            "'Saya' or 'aku' (informal) = I/me. "
            "'Awak' or 'kamu' (informal) = you (singular). "
            "'Dia' = he/she/it (Malay does not distinguish gender in pronouns). "
            "'Kami' = we/us (exclusive — does not include the listener). "
            "'Kita' = we/us (inclusive — includes the listener). "
            "'Mereka' = they/them. "
            "'Anda' = you (formal or written, e.g. in forms and manuals). "
            "Example: 'Kami pergi ke pasar. Awak tidak ikut?' — We are going to the market. Aren't you coming along?"
        ),
        "metadata": {"type": "grammar", "level": "A1", "topic": "pronouns"},
    },
    # ── Basic Sentence Structure (A1) ──────────────────────────────────────────
    {
        "content": (
            "Basic Malay sentence structure follows Subject-Verb-Object (SVO), similar to English. "
            "There is no verb conjugation for tense in Malay — time is indicated by time words. "
            "'Saya makan nasi' = I eat rice. "
            "To indicate past, add 'semalam' (yesterday) or 'sudah/telah' (already): 'Saya sudah makan' = I have already eaten. "
            "To indicate future, add 'esok' (tomorrow) or 'akan' (will): 'Saya akan makan' = I will eat. "
            "To indicate present continuous, add 'sedang': 'Saya sedang makan' = I am (currently) eating. "
            "Example: 'Dia sedang belajar bahasa Melayu di perpustakaan.' — She is currently studying Malay in the library."
        ),
        "metadata": {"type": "grammar", "level": "A1", "topic": "sentence structure"},
    },
    # ── Negation (A1) ─────────────────────────────────────────────────────────
    {
        "content": (
            "Negation in Malay uses 'tidak' (not) for verbs and adjectives, and 'bukan' (not/no) for nouns and pronouns. "
            "'Saya tidak makan' = I do not eat. "
            "'Ini bukan buku saya' = This is not my book. "
            "'Dia tidak lapar' = He/she is not hungry. "
            "'Awak bukan pelajar?' = You are not a student? "
            "The word 'jangan' is used to form negative commands (don't): 'Jangan bising!' = Don't be noisy! "
            "Remember: 'tidak' negates actions and states, while 'bukan' negates identities and nouns. "
            "Example: 'Saya tidak suka durian, tetapi saya suka mango.' — I don't like durian, but I like mango."
        ),
        "metadata": {"type": "grammar", "level": "A1", "topic": "negation"},
    },
    # ── Numbers 1–20 (A1) ──────────────────────────────────────────────────────
    {
        "content": (
            "Malay numbers 1–20: "
            "satu (1), dua (2), tiga (3), empat (4), lima (5), enam (6), tujuh (7), lapan (8), sembilan (9), sepuluh (10), "
            "sebelas (11), dua belas (12), tiga belas (13), empat belas (14), lima belas (15), "
            "enam belas (16), tujuh belas (17), lapan belas (18), sembilan belas (19), dua puluh (20). "
            "For tens: tiga puluh (30), empat puluh (40), lima puluh (50), enam puluh (60), tujuh puluh (70), lapan puluh (80), sembilan puluh (90), seratus (100). "
            "Combining: dua puluh lima (25), tiga puluh lapan (38). "
            "Example: 'Saya ada tiga buku dan dua puluh sen.' — I have three books and twenty cents."
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "numbers"},
    },
    # ── Days of the Week (A1) ──────────────────────────────────────────────────
    {
        "content": (
            "Days of the week in Malay: "
            "Isnin (Monday), Selasa (Tuesday), Rabu (Wednesday), Khamis (Thursday), Jumaat (Friday), Sabtu (Saturday), Ahad/Minggu (Sunday). "
            "'Hari ini hari apa?' = What day is it today? "
            "'Hari ini hari Isnin' = Today is Monday. "
            "'Minggu depan' = next week. 'Minggu lepas' = last week. "
            "Malay school and government offices are closed on Saturday and Sunday. "
            "Friday prayer (Solat Jumaat) is important in Malaysian Muslim culture. "
            "Example: 'Kelas bahasa Melayu saya pada hari Rabu dan Jumaat.' — My Malay class is on Wednesday and Friday."
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "days of the week"},
    },
    # ── Months & Dates (A1) ────────────────────────────────────────────────────
    {
        "content": (
            "Months in Malay: "
            "Januari, Februari, Mac, April, Mei, Jun, Julai, Ogos, September, Oktober, November, Disember. "
            "To express a date: '[day] [month] [year]' — '5 Mei 2024' (5th May 2024). "
            "'Pada' is used before dates and months: 'Pada 1 Januari' = On 1st January. "
            "'Bulan apa sekarang?' = What month is it now? "
            "'Tahun ini' = this year. 'Tahun depan' = next year. 'Tahun lepas' = last year. "
            "Example: 'Hari jadi saya pada 15 Ogos. Tahun ini saya genap dua puluh tahun.' — My birthday is on 15th August. This year I turn twenty."
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "months and dates"},
    },
    # ── Telling Time (A1/A2) ──────────────────────────────────────────────────
    {
        "content": (
            "Telling time in Malay: 'Pukul berapa sekarang?' = What time is it now? "
            "'Pukul' means o'clock. 'Pukul tiga' = 3 o'clock. "
            "'Pukul tiga setengah' = 3:30 (half past three). "
            "'Pukul tiga suku' = 3:15 (quarter past three). "
            "'Pukul empat kurang suku' = 3:45 (quarter to four). "
            "'Pagi' = morning (AM), 'Petang' = afternoon/evening (PM after noon), 'Malam' = night. "
            "'Tengah hari' = midday/noon. 'Tengah malam' = midnight. "
            "Example: 'Kelas bermula pukul lapan pagi dan tamat pukul sepuluh pagi.' — Class starts at 8 AM and ends at 10 AM."
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "time"},
    },
    # ── Family Members (A1) ───────────────────────────────────────────────────
    {
        "content": (
            "Family vocabulary in Malay: "
            "bapa/ayah (father), ibu/emak (mother), abang (older brother), kakak (older sister), "
            "adik (younger sibling — male or female), anak (child/son/daughter), "
            "datuk/atuk (grandfather), nenek (grandmother), pakcik (uncle), makcik (aunt), "
            "sepupu (cousin), suami (husband), isteri (wife). "
            "Malay uses different words for older vs younger siblings, unlike English. "
            "'Keluarga saya' = my family. "
            "Example: 'Keluarga saya terdiri daripada ibu, bapa, seorang abang dan dua adik perempuan.' — My family consists of my mother, father, one older brother and two younger sisters."
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "family"},
    },
    # ── Basic Food Vocabulary (A1) ────────────────────────────────────────────
    {
        "content": (
            "Common food words in Malay: "
            "nasi (cooked rice), mee/mi (noodles), roti (bread), ayam (chicken), daging (beef/meat), "
            "ikan (fish), sayur (vegetables), buah (fruit), air (water/drink), susu (milk), "
            "kopi (coffee), teh (tea), gula (sugar), garam (salt), pedas (spicy), manis (sweet), "
            "masam (sour), pahit (bitter), sedap (delicious). "
            "Popular Malaysian dishes: nasi lemak (coconut rice with sambal), mee goreng (fried noodles), "
            "roti canai (flatbread), laksa (spicy noodle soup). "
            "Example: 'Nasi lemak sangat sedap. Saya suka makan nasi lemak untuk sarapan.' — Nasi lemak is very delicious. I like eating nasi lemak for breakfast."
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "food"},
    },
    # ── Ordering Food (A2) ────────────────────────────────────────────────────
    {
        "content": (
            "Ordering food and drinks in Malay: "
            "'Saya nak pesan...' = I would like to order... "
            "'Boleh saya tengok menu?' = May I see the menu? "
            "'Berapa harga ini?' = How much does this cost? "
            "'Saya nak satu nasi goreng dan satu teh tarik' = I want one fried rice and one pulled tea. "
            "'Kurang pedas boleh?' = Can you make it less spicy? "
            "'Tanpa daging' = without meat (for vegetarians). "
            "'Bungkus' = takeaway/to go. 'Makan sini' = eat here. "
            "'Boleh minta bil?' = Can I have the bill please? "
            "Example: 'Abang, boleh saya pesan mee goreng satu, kurang pedas, bungkus.' — Sir, can I order one fried noodles, less spicy, to go."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "ordering food"},
    },
    # ── Colors (A1) ───────────────────────────────────────────────────────────
    {
        "content": (
            "Colors in Malay: "
            "merah (red), biru (blue), hijau (green), kuning (yellow), putih (white), hitam (black), "
            "oren (orange), ungu (purple), perang (brown), kelabu (grey), merah jambu/merah muda (pink), "
            "emas (gold), perak (silver). "
            "To describe a noun: adjective follows the noun in Malay. "
            "'Baju merah' = red shirt. 'Kereta biru' = blue car. "
            "'Langit biru' = blue sky. 'Daun hijau' = green leaf. "
            "Example: 'Saya suka pakai baju putih dan seluar biru.' — I like wearing a white shirt and blue pants."
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "colors"},
    },
    # ── Adjective Placement (A1/A2) ───────────────────────────────────────────
    {
        "content": (
            "In Malay, adjectives come AFTER the noun, not before it (unlike English). "
            "'Rumah besar' = big house (literally: house big). "
            "'Buku merah' = red book. 'Pelajar rajin' = hardworking student. "
            "Common adjectives: besar (big), kecil (small), cantik (beautiful), hodoh (ugly), "
            "cerdas/bijak (smart), malas (lazy), rajin (hardworking), penat (tired), lapar (hungry), "
            "kenyang (full/satiated), sakit (sick/pain), sihat (healthy), baru (new), lama (old/used). "
            "Intensifiers: sangat/amat (very), agak (quite/rather), terlalu (too). "
            "'Rumah sangat besar' = The house is very big. "
            "Example: 'Dia pelajar rajin. Dia selalu datang awal ke kelas.' — She is a hardworking student. She always comes early to class."
        ),
        "metadata": {"type": "grammar", "level": "A1", "topic": "adjectives"},
    },
    # ── Question Words (A1) ───────────────────────────────────────────────────
    {
        "content": (
            "Malay question words (kata tanya): "
            "'Apa' = what (e.g. 'Apa ini?' — What is this?). "
            "'Siapa' = who (e.g. 'Siapa nama awak?' — What is your name? / Who are you?). "
            "'Bila' = when (e.g. 'Bila kelas bermula?' — When does class start?). "
            "'Di mana' = where (e.g. 'Di mana tandas?' — Where is the toilet?). "
            "'Kenapa/mengapa' = why (e.g. 'Kenapa awak lambat?' — Why are you late?). "
            "'Bagaimana' = how (e.g. 'Bagaimana cara membuat ini?' — How do you do this?). "
            "'Berapa' = how many/much (e.g. 'Berapa ringgit?' — How many ringgit?). "
            "'Yang mana' = which (e.g. 'Yang mana satu?' — Which one?). "
            "Example: 'Di mana awak tinggal? Berapa jauh dari sini?' — Where do you live? How far is it from here?"
        ),
        "metadata": {"type": "grammar", "level": "A1", "topic": "question words"},
    },
    # ── Basic Verbs (A1) ──────────────────────────────────────────────────────
    {
        "content": (
            "Common Malay verbs (kata kerja): "
            "makan (eat), minum (drink), tidur (sleep), bangun (wake up/get up), pergi (go), "
            "datang (come), duduk (sit), berdiri (stand), berjalan (walk), berlari (run), "
            "belajar (study/learn), mengajar (teach), baca (read), tulis (write), "
            "tengok/tonton (watch/look), dengar (listen), cakap/bercakap (speak/talk), "
            "tolong (help), beli (buy), jual (sell), ambil (take), bagi (give). "
            "Malay verbs do not conjugate for person or number — the same form is used for all subjects. "
            "Example: 'Setiap pagi, saya bangun, mandi, sarapan, kemudian pergi ke kelas.' — Every morning, I wake up, shower, eat breakfast, then go to class."
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "basic verbs"},
    },
    # ── Prepositions of Place (A1/A2) ─────────────────────────────────────────
    {
        "content": (
            "Malay prepositions of place: "
            "'Di' = at/in (location): 'di rumah' (at home), 'di sekolah' (at school). "
            "'Ke' = to (direction): 'ke pasar' (to the market), 'ke mana?' (where to?). "
            "'Dari' = from: 'dari rumah' (from home), 'dari mana?' (from where?). "
            "'Dalam' = inside/in: 'dalam bilik' (in the room). "
            "'Atas' = on/above: 'atas meja' (on the table). "
            "'Bawah' = under/below: 'bawah kerusi' (under the chair). "
            "'Di depan' = in front of. 'Di belakang' = behind. 'Di sebelah' = beside/next to. "
            "'Di antara' = between. "
            "Example: 'Buku itu ada di atas meja, di sebelah komputer.' — The book is on the table, next to the computer."
        ),
        "metadata": {"type": "grammar", "level": "A1", "topic": "prepositions"},
    },
    # ── Body Parts (A1) ───────────────────────────────────────────────────────
    {
        "content": (
            "Body parts in Malay (anggota badan): "
            "kepala (head), rambut (hair), muka/wajah (face), mata (eye), hidung (nose), "
            "mulut (mouth), telinga (ear), leher (neck), bahu (shoulder), tangan (hand/arm), "
            "jari (finger), dada (chest), perut (stomach/belly), belakang (back), "
            "kaki (leg/foot), lutut (knee), jari kaki (toe). "
            "'Sakit kepala' = headache. 'Sakit perut' = stomachache. 'Sakit gigi' = toothache. "
            "At the doctor: 'Di mana awak sakit?' = Where does it hurt? "
            "'Kaki saya sakit' = My leg hurts. "
            "Example: 'Saya sakit kepala dan sakit tekak hari ini.' — I have a headache and sore throat today."
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "body parts"},
    },
    # ── Directions (A2) ───────────────────────────────────────────────────────
    {
        "content": (
            "Giving and asking for directions in Malay: "
            "'Maaf, boleh tunjukkan jalan ke...?' = Excuse me, can you show me the way to...? "
            "'Pergi terus' = go straight. 'Belok kiri' = turn left. 'Belok kanan' = turn right. "
            "'Di hujung jalan' = at the end of the road. 'Di simpang tiga/empat' = at the T-junction/crossroads. "
            "'Dekat' = near. 'Jauh' = far. 'Berapa jauh?' = How far? "
            "'Berjalan kaki dalam masa lima minit' = a five-minute walk. "
            "'Di seberang jalan' = across the road. 'Bersebelahan dengan' = next to. "
            "Example: 'Pergi terus, kemudian belok kanan di lampu merah. Hospital itu di sebelah kiri awak.' — Go straight, then turn right at the traffic light. The hospital is on your left."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "directions"},
    },
    # ── Shopping Vocabulary (A2) ──────────────────────────────────────────────
    {
        "content": (
            "Shopping in Malay: "
            "'Kedai' = shop. 'Pasar' = market. 'Pasaraya' = supermarket. 'Pusat membeli-belah' = shopping mall. "
            "'Berapa harga ini?' = How much is this? 'Mahal' = expensive. 'Murah' = cheap. "
            "'Boleh kurangkan harga?' = Can you lower the price? (bargaining). "
            "'Saya nak beli ini' = I want to buy this. 'Ada saiz lain?' = Do you have another size? "
            "'Bayar tunai' = pay cash. 'Bayar dengan kad' = pay by card. "
            "'Terima kasih, ini baki awak' = Thank you, here is your change. "
            "'Baki' = change (money). 'Resit' = receipt. "
            "Example: 'Baju ini berapa? Boleh dapat diskaun? Saya bayar dengan kad boleh?' — How much is this shirt? Can I get a discount? Can I pay by card?"
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "shopping"},
    },
    # ── Transport Vocabulary (A2) ─────────────────────────────────────────────
    {
        "content": (
            "Transport vocabulary in Malay: "
            "kereta (car), bas (bus), teksi (taxi), lori (truck), motosikal (motorcycle), "
            "basikal (bicycle), kapal terbang (airplane), kapal (ship), kereta api/tren (train), LRT (light rail). "
            "'Naik bas' = take the bus. 'Pergi dengan teksi' = go by taxi. "
            "'Stesen bas' = bus station. 'Lapangan terbang' = airport. 'Stesen tren' = train station. "
            "'Berapa tiket ke KL?' = How much is a ticket to KL? "
            "'Pukul berapa bas pertama?' = What time is the first bus? "
            "'Saya nak turun di stesen berikut' = I want to get off at the next station. "
            "Example: 'Saya biasanya naik LRT ke universiti kerana lebih cepat daripada bas.' — I usually take the LRT to university because it is faster than the bus."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "transport"},
    },
    # ── Weather (A1/A2) ───────────────────────────────────────────────────────
    {
        "content": (
            "Weather vocabulary in Malay: "
            "'Cuaca' = weather. 'Panas' = hot. 'Sejuk' = cold. 'Hujan' = rain (verb/noun). "
            "'Ribut' = storm. 'Berangin' = windy. 'Cerah' = sunny/bright. 'Mendung' = cloudy/overcast. "
            "'Banjir' = flood. 'Kemarau' = drought. "
            "'Cuaca hari ini bagaimana?' = What is the weather like today? "
            "'Hari ini panas sangat' = It is very hot today. "
            "'Hujan lebat' = heavy rain. 'Gerimis' = light drizzle. "
            "Malaysia has a tropical climate with rain throughout the year. "
            "Monsoon season: the east coast experiences the northeast monsoon (November–March). "
            "Example: 'Bawa payung sebab langit mendung dan mungkin akan hujan petang ini.' — Bring an umbrella because the sky is cloudy and it might rain this evening."
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "weather"},
    },
    # ── Clothing (A2) ─────────────────────────────────────────────────────────
    {
        "content": (
            "Clothing vocabulary in Malay: "
            "baju (shirt/top/clothing in general), seluar (pants/trousers), skirt (skirt), "
            "gaun/baju kurung (traditional Malay dress for women), baju Melayu (traditional Malay attire for men), "
            "kasut (shoes), sandal (sandals), stokin (socks), topi (hat/cap), "
            "beg (bag), jam tangan (wristwatch), cermin mata (glasses), tali leher (necktie). "
            "'Pakai' = to wear. 'Tanggal' = to take off (clothing). "
            "'Baju kurung' is the traditional dress worn by Malay women during festivals and formal occasions. "
            "'Baju Melayu' is worn by Malay men with a 'sampin' (sarong cloth). "
            "Example: 'Pada hari raya, saya pakai baju kurung berwarna hijau dengan kain batik.' — On Hari Raya, I wear a green baju kurung with batik fabric."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "clothing"},
    },
    # ── Home and Furniture (A2) ───────────────────────────────────────────────
    {
        "content": (
            "Home and household vocabulary in Malay: "
            "rumah (house/home), bilik tidur (bedroom), bilik mandi (bathroom), dapur (kitchen), "
            "ruang tamu (living room), ruang makan (dining room), balkoni (balcony). "
            "Furniture: katil (bed), meja (table), kerusi (chair), almari (wardrobe/cabinet), "
            "sofa (sofa), televisyen/TV (television), peti sejuk (refrigerator), dapur gas (gas stove), "
            "mesin basuh (washing machine), penghawa dingin/aircond (air conditioner), kipas (fan). "
            "Example: 'Bilik tidur saya ada sebuah katil, sebuah meja belajar dan sebuah almari baju.' — My bedroom has a bed, a study table, and a wardrobe."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "home and furniture"},
    },
    # ── Education Vocabulary (A2) ─────────────────────────────────────────────
    {
        "content": (
            "Education vocabulary in Malay: "
            "sekolah (school), universiti (university), kolej (college), kelas (class/classroom), "
            "guru/cikgu (teacher — school level), pensyarah/profesor (lecturer/professor — university level), "
            "pelajar/murid (student), buku teks (textbook), buku latihan (exercise book), "
            "pensil (pencil), pen (pen), pembaris (ruler), pemadam (eraser), kalkulator (calculator), "
            "peperiksaan/exam (examination), ujian/kuiz (test/quiz), tugasan/kerja rumah (assignment/homework), "
            "perpustakaan (library), kantin (canteen), asrama (dormitory/hostel). "
            "Example: 'Saya perlu pergi ke perpustakaan untuk siapkan tugasan sebelum peperiksaan minggu depan.' — I need to go to the library to complete my assignment before next week's examination."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "education"},
    },
    # ── Feelings and Emotions (A2) ────────────────────────────────────────────
    {
        "content": (
            "Expressing feelings and emotions in Malay: "
            "gembira/seronok (happy/fun), sedih (sad), marah (angry), takut (afraid/scared), "
            "malu (shy/embarrassed), bosan (bored), teruja (excited), terkejut (surprised), "
            "risau/bimbang (worried), tenang (calm), kecewa (disappointed), bangga (proud). "
            "'Saya rasa...' = I feel... / 'Saya berasa...' = I feel... "
            "'Awak okay?' = Are you okay? 'Saya okay' = I am okay. "
            "'Kenapa awak nampak sedih?' = Why do you look sad? "
            "Example: 'Saya rasa sangat gembira dan teruja kerana esok cuti panjang!' — I feel very happy and excited because tomorrow is a long holiday!"
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "feelings and emotions"},
    },
    # ── Conjunctions (A2) ─────────────────────────────────────────────────────
    {
        "content": (
            "Common Malay conjunctions (kata hubung): "
            "'Dan' = and (e.g. 'saya dan awak' — you and I). "
            "'Atau' = or (e.g. 'kopi atau teh?' — coffee or tea?). "
            "'Tetapi/tapi' = but (e.g. 'saya suka, tetapi mahal' — I like it, but it is expensive). "
            "'Kerana/sebab' = because (e.g. 'saya lambat kerana hujan' — I was late because of rain). "
            "'Jadi/oleh itu' = so/therefore (e.g. 'hujan, jadi saya tidak keluar' — it rained, so I didn't go out). "
            "'Walaupun/meskipun' = although/even though (e.g. 'walaupun penat, dia terus belajar' — although tired, she kept studying). "
            "'Kalau/jika' = if (e.g. 'kalau hujan, bawa payung' — if it rains, bring an umbrella). "
            "Example: 'Saya suka belajar bahasa Melayu walaupun kadang-kadang susah.' — I like learning Malay although it is sometimes difficult."
        ),
        "metadata": {"type": "grammar", "level": "A2", "topic": "conjunctions"},
    },
    # ── Modal Verbs (A2) ──────────────────────────────────────────────────────
    {
        "content": (
            "Malay modal verbs (kata kerja bantu): "
            "'Boleh' = can/may/able to: 'Saya boleh cakap Melayu' (I can speak Malay). "
            "'Tidak boleh' = cannot: 'Awak tidak boleh masuk' (You cannot enter). "
            "'Mahu/nak' = want to: 'Saya nak belajar memasak' (I want to learn cooking). "
            "'Perlu/kena' = need to/must: 'Awak perlu buat latihan ini' (You need to do this exercise). "
            "'Harus/mesti' = should/must (stronger): 'Kita mesti jaga kesihatan' (We must take care of our health). "
            "'Ingin' = wish to (more formal than nak): 'Saya ingin bertanya soalan' (I would like to ask a question). "
            "Example: 'Awak boleh berbicara dengan pensyarah kalau awak perlu bantuan.' — You can speak to the lecturer if you need help."
        ),
        "metadata": {"type": "grammar", "level": "A2", "topic": "modal verbs"},
    },
    # ── Comparative & Superlative (A2) ────────────────────────────────────────
    {
        "content": (
            "Comparative and superlative forms in Malay: "
            "Comparative: 'lebih [adjective] daripada' = more [adjective] than. "
            "'Kuala Lumpur lebih besar daripada Ipoh' = KL is bigger than Ipoh. "
            "'Dia lebih pandai daripada saya' = She is smarter than me. "
            "Superlative: 'paling [adjective]' = the most [adjective]. "
            "'Ini yang paling murah' = This is the cheapest. "
            "'Dia paling rajin dalam kelas' = She is the most hardworking in class. "
            "Equality: 'sama [adjective] dengan' = as [adjective] as. "
            "'Baju ini sama mahal dengan baju itu' = This shirt is as expensive as that shirt. "
            "Example: 'Universiti ini paling terkenal di Malaysia dan lebih besar daripada kolej saya dulu.' — This university is the most famous in Malaysia and bigger than my former college."
        ),
        "metadata": {"type": "grammar", "level": "A2", "topic": "comparative and superlative"},
    },
    # ── Frequency Adverbs (A2) ────────────────────────────────────────────────
    {
        "content": (
            "Frequency adverbs in Malay: "
            "'Sentiasa/selalu' = always. 'Kerap/sering' = often/frequently. "
            "'Kadang-kadang' = sometimes. 'Jarang' = rarely/seldom. "
            "'Tidak pernah' = never. 'Sekali-sekala' = occasionally/once in a while. "
            "These adverbs usually come before the verb: 'Saya selalu makan sarapan' = I always eat breakfast. "
            "'Dia jarang datang lambat' = He rarely comes late. "
            "You can also use: 'setiap hari' (every day), 'setiap minggu' (every week), 'setiap bulan' (every month). "
            "Example: 'Saya kadang-kadang jogging pagi, tetapi saya sentiasa minum air yang banyak setiap hari.' — I sometimes jog in the morning, but I always drink a lot of water every day."
        ),
        "metadata": {"type": "grammar", "level": "A2", "topic": "frequency adverbs"},
    },
    # ── Making Requests (A1/A2) ───────────────────────────────────────────────
    {
        "content": (
            "Making polite requests in Malay: "
            "'Tolong' = please (used before a verb in a request): 'Tolong buka pintu' (Please open the door). "
            "'Boleh' = can (used to form polite requests): 'Boleh awak tolong saya?' (Can you help me?). "
            "'Minta' = request/ask for: 'Boleh saya minta air sejuk?' (May I have cold water?). "
            "'Sila' = please (formal, often in written form or announcements): 'Sila duduk' (Please sit down). "
            "'Maaf' = excuse me/sorry (to get attention or apologise): 'Maaf, di mana tandas?' (Excuse me, where is the toilet?). "
            "'Terima kasih' = thank you. 'Sama-sama' = you're welcome. 'Tak apalah' = no worries/it's okay. "
            "Example: 'Maaf, boleh awak tolong saya? Saya nak minta bantuan dengan tugasan ini.' — Excuse me, could you help me? I would like to ask for help with this assignment."
        ),
        "metadata": {"type": "grammar", "level": "A1", "topic": "making requests"},
    },
    # ── The MeN- Prefix (A2/B1) ───────────────────────────────────────────────
    {
        "content": (
            "The meN- prefix in Malay transforms root words into active transitive verbs. "
            "The prefix changes form based on the first letter of the root word: "
            "me + verb starting with l, m, n, r, w, y: no change — 'melarikan' (to flee with). "
            "me + b/p → mem: 'membeli' (to buy), 'memotong' (to cut). "
            "me + d/t → men: 'mendapat' (to get), 'menangis' (to cry). "
            "me + g/k → meng: 'mengambil' (to take), 'menulis' (wait — tu, starts with t → men): actually 'menulis' from 'tulis'. "
            "me + c/j/sy/z → men: 'mencari' (to search). "
            "me + s → meny: 'menyapu' (to sweep). "
            "Examples: 'makan' → 'memakan', 'tulis' → 'menulis', 'baca' → 'membaca', 'jual' → 'menjual'. "
            "Example sentence: 'Dia sedang membaca buku di perpustakaan.' — She is reading a book in the library."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "meN- prefix"},
    },
    # ── The ber- Prefix (A2/B1) ───────────────────────────────────────────────
    {
        "content": (
            "The ber- prefix in Malay creates intransitive verbs, meaning the action does not require an object. "
            "'Berjalan' (from 'jalan' = road/walk) = to walk. "
            "'Berlari' (from 'lari' = run) = to run. "
            "'Berbicara/bercakap' (from 'cakap' = talk) = to speak/converse. "
            "'Berpakaian' (from 'pakaian' = clothing) = to get dressed/wear clothing. "
            "'Belajar' is technically ber + ajar — to learn/study. "
            "'Bertemu' (from 'temu' = meet) = to meet each other. "
            "'Bermain' (from 'main' = play) = to play. "
            "ber- verbs often describe activities, states, or reciprocal actions. "
            "Example: 'Kami bertemu di kafe dan bercakap dalam bahasa Melayu selama dua jam.' — We met at a cafe and spoke in Malay for two hours."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "ber- prefix"},
    },
    # ── The di- Passive (B1) ──────────────────────────────────────────────────
    {
        "content": (
            "The di- prefix forms the passive voice in Malay, equivalent to 'is/was done' in English. "
            "Active: 'Ali membeli buku itu' = Ali bought the book. "
            "Passive: 'Buku itu dibeli oleh Ali' = The book was bought by Ali. "
            "The agent (doer) is introduced with 'oleh' (by): 'Surat itu ditulis oleh pelajar' = The letter was written by a student. "
            "'Oleh' can be dropped if the agent is clear from context: 'Makanan sudah disediakan' = The food has been prepared. "
            "Common di- verbs: 'dibuat' (made/done), 'dibeli' (bought), 'ditulis' (written), 'dihantar' (sent), 'dijual' (sold). "
            "The passive is very common in formal and written Malay. "
            "Example: 'Projek itu akan disiapkan oleh kumpulan kami pada minggu depan.' — The project will be completed by our group next week."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "di- passive"},
    },
    # ── The ter- Prefix (B1) ──────────────────────────────────────────────────
    {
        "content": (
            "The ter- prefix in Malay indicates: (1) accidental action, (2) completed state, or (3) ability/capability. "
            "(1) Accidental: 'terjatuh' (fell accidentally), 'terlupa' (forgot accidentally), 'tertukar' (accidentally swapped). "
            "(2) Completed state: 'tersenyum' (is/was smiling), 'terbuka' (is open/was opened). "
            "(3) Can/able: 'terbeli' = can be bought/affordable, 'terukur' = can be measured. "
            "'Saya terlupa bawa dompet' = I forgot to bring my wallet (accidentally). "
            "'Pintu itu terbuka' = The door is open (in a state of being open). "
            "'Harga itu tidak terbeli oleh saya' = I cannot afford that price. "
            "Example: 'Maaf, saya tersilap hantar mesej kepada awak.' — Sorry, I accidentally sent the wrong message to you."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "ter- prefix"},
    },
    # ── ke-an Suffix (B1) ─────────────────────────────────────────────────────
    {
        "content": (
            "The ke-an circumfix (ke- + root + -an) in Malay forms: (1) abstract nouns from adjectives, (2) state/condition nouns, or (3) excessive degree. "
            "(1) Abstract nouns: 'keindahan' (beauty, from 'indah'), 'kebersihan' (cleanliness, from 'bersih'), 'kebaikan' (goodness, from 'baik'). "
            "(2) State/condition: 'kesakitan' (illness/pain, from 'sakit'), 'kemiskinan' (poverty, from 'miskin'). "
            "(3) Excessive: 'kepanasan' (too hot), 'kesejukan' (too cold), 'kelaparan' (starving/very hungry). "
            "'Kecantikan alam semula jadi Malaysia sangat terkenal' = The natural beauty of Malaysia is very well-known. "
            "Example: 'Keindahan pantai di Langkawi membuatkan pelancong dari seluruh dunia datang berkunjung.' — The beauty of the beaches in Langkawi attracts tourists from all over the world."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "ke-an circumfix"},
    },
    # ── pe-an Suffix (B1) ─────────────────────────────────────────────────────
    {
        "content": (
            "The pe-an circumfix (pe- + root + -an) forms nouns that indicate a place, process, or result of an action. "
            "'Pembelajaran' (learning/education process, from 'belajar'): 'sistem pembelajaran' = education system. "
            "'Pekerjaan' (work/employment, from 'kerja'): 'mencari pekerjaan' = looking for a job. "
            "'Perjalanan' (journey/travel, from 'jalan'): 'perjalanan jauh' = long journey. "
            "'Peperiksaan' (examination, from 'periksa'): 'mengambil peperiksaan' = to sit an examination. "
            "'Pembangunan' (development, from 'bangun'): 'pembangunan negara' = national development. "
            "'Pengetahuan' (knowledge, from 'tahu'): 'pengetahuan am' = general knowledge. "
            "Example: 'Pembelajaran bahasa asing memerlukan ketekunan dan latihan yang berterusan.' — Learning a foreign language requires diligence and continuous practice."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "pe-an circumfix"},
    },
    # ── Reduplication (B1) ────────────────────────────────────────────────────
    {
        "content": (
            "Reduplication (pengulangan kata) in Malay serves several purposes: "
            "(1) Plural nouns (context-dependent): 'buku-buku' = books (many). "
            "(2) Variety/diversity: 'buah-buahan' = all kinds of fruits. 'sayur-sayuran' = all kinds of vegetables. "
            "(3) Verb repetition (action done repeatedly or casually): 'jalan-jalan' = to stroll/walk around leisurely. 'makan-makan' = to eat (casually). "
            "(4) Reduplication with change: 'bermacam-macam' = various kinds. 'berlain-lain' = different from each other. "
            "(5) Reciprocal action: 'pukul-memukul' = hitting each other. "
            "Note: Plural is often implied by context, so reduplication is not always necessary to indicate plural. "
            "Example: 'Hujung minggu ini kami rancang untuk jalan-jalan di pasar malam dan makan-makan bersama.' — This weekend we plan to stroll at the night market and eat together casually."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "reduplication"},
    },
    # ── Particles: lah, loh, ke (A2/B1) ──────────────────────────────────────
    {
        "content": (
            "Malay sentence-final particles add tone and nuance: "
            "'Lah' softens commands, makes statements more casual, or adds mild emphasis. "
            "'Jangan risau lah' = Don't worry, okay. 'Sudah makan lah' = I've already eaten (lah adds mild insistence). "
            "'Loh/lo' expresses mild surprise, confusion, or adding information: 'Saya tak tahu loh' = I didn't know (expressing mild surprise at one's own ignorance). "
            "'Ke' (at the end of a sentence) turns a statement into a gentle question: "
            "'Awak dah makan ke?' = Have you eaten (already)? 'Betul ke?' = Is that true? Really? "
            "These particles are characteristic of Malaysian spoken Malay and Manglish (Malaysian English blend). "
            "Formal written Malay does not use these particles. "
            "Example: 'Alamak, awak belum tahu ke? Esok ada peperiksaan lah!' — Oh no, you don't know yet? There's an exam tomorrow, you know!"
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "sentence particles"},
    },
    # ── Formal vs Informal Register (B1) ─────────────────────────────────────
    {
        "content": (
            "Malay has a clear distinction between formal (Bahasa Melayu rasmi) and informal (bahasa pasar/percakapan) registers. "
            "Formal 'saya' vs informal 'aku' (for I/me). "
            "Formal 'awak/anda' vs informal 'kau/engkau' (for you). "
            "Formal 'tidak' vs informal 'tak' (for not). 'Sudah' vs 'dah' (for already). "
            "'Hendak/mahu' (formal want) vs 'nak' (informal). "
            "Formal: 'Saya tidak memahami perkara ini.' (I do not understand this matter.) "
            "Informal: 'Saya tak faham benda ni lah.' (I don't get this thing.) "
            "Use formal language in academic writing, official letters, presentations, and speaking to authority figures. "
            "Informal language is used with friends, family, and in casual settings. "
            "Example: Formal — 'Saya ingin menyatakan bahawa tugasan ini telah saya siapkan mengikut masa yang ditetapkan.' vs Informal — 'Aku dah siap buat kerja tu dah.'"
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "formal vs informal"},
    },
    # ── Common Idioms & Peribahasa (B1/B2) ───────────────────────────────────
    {
        "content": (
            "Common Malay idioms and proverbs (peribahasa): "
            "'Biar lambat asalkan selamat' = Better late than never (lit. Better slow as long as safe). "
            "'Seperti katak di bawah tempurung' = Like a frog under a coconut shell (narrow-minded, unaware of the outside world). "
            "'Tepuk dada tanya selera' = Follow your heart (lit. Pat your chest and ask your appetite). "
            "'Bersatu teguh, bercerai roboh' = Unity is strength; divided we fall. "
            "'Seperti menatang minyak yang penuh' = To treat something with extreme care (lit. Like carrying a full container of oil). "
            "'Seperti aur dengan tebing' = Inseparable friends (lit. Like bamboo and the river bank — they support each other). "
            "Peribahasa are widely used in formal essays and speeches in Malaysian education. "
            "Example: 'Dalam kerja berpasukan, kita perlu ingat: bersatu teguh, bercerai roboh.' — In teamwork, we must remember: united we stand, divided we fall."
        ),
        "metadata": {"type": "culture", "level": "B1", "topic": "idioms and proverbs"},
    },
    # ── Malaysian Culture: Hari Raya (A2/B1) ─────────────────────────────────
    {
        "content": (
            "Hari Raya Aidilfitri (also called Hari Raya Puasa) is the most important Muslim festival in Malaysia. "
            "It marks the end of Ramadan (the fasting month). "
            "Common greetings: 'Selamat Hari Raya' or 'Selamat Hari Raya Aidilfitri'. "
            "'Maaf zahir dan batin' = I seek forgiveness from the bottom of my heart (for any wrongdoings). "
            "Traditions: visiting family and neighbours (beraya), wearing new baju kurung/baju Melayu, giving 'duit raya' (money in green envelopes) to children, eating ketupat (rice cakes), rendang (slow-cooked meat), and kuih (traditional cakes). "
            "Hari Raya Aidiladha celebrates the willingness of Prophet Ibrahim to sacrifice his son. "
            "Example: 'Semasa Hari Raya, saya akan balik kampung untuk beraya bersama-sama keluarga besar.' — During Hari Raya, I will go back to my hometown to celebrate with my extended family."
        ),
        "metadata": {"type": "culture", "level": "A2", "topic": "Hari Raya"},
    },
    # ── Malaysian Culture: Chinese New Year (A2) ──────────────────────────────
    {
        "content": (
            "Tahun Baru Cina (Chinese New Year) is a major celebration in Malaysia, observed by the Chinese community. "
            "Greeting: 'Selamat Tahun Baru Cina' in Malay. In Mandarin: 'Gong Xi Fa Cai' (wishing you prosperity). "
            "Traditions: lion dance (tarian singa), fireworks, giving 'angpow' (red envelopes with money), reunion dinner. "
            "Typical foods: yee sang (prosperity salad), nian gao (sticky rice cake), dumplings. "
            "The streets of Chinatown (Petaling Street in KL) are decorated with red lanterns. "
            "It is a national public holiday in Malaysia, reflecting the country's multicultural nature. "
            "In Malay: 'Malaysia merupakan negara berbilang kaum yang merayakan pelbagai perayaan.' — Malaysia is a multiracial country that celebrates various festivals."
        ),
        "metadata": {"type": "culture", "level": "A2", "topic": "Chinese New Year"},
    },
    # ── Malaysian Culture: Deepavali & Wesak (A2) ─────────────────────────────
    {
        "content": (
            "Deepavali (also called Diwali) is celebrated by the Hindu Tamil community in Malaysia. "
            "It is known as the Festival of Lights ('Festival Cahaya' in Malay). "
            "Greeting: 'Selamat Deepavali'. Traditions: lighting oil lamps (kolam), visiting temples, exchanging sweets. "
            "Wesak Day (Hari Wesak) is a Buddhist festival commemorating the birth, enlightenment, and death of Gautama Buddha. "
            "Greeting: 'Selamat Hari Wesak'. Traditions: processions, releasing caged birds, visiting temples. "
            "Malaysia's diversity means multiple public holidays for different communities. "
            "'Kita meraikan kepelbagaian budaya Malaysia' = We celebrate Malaysia's cultural diversity. "
            "Example: 'Semua perayaan di Malaysia disambut bersama-sama tanpa mengira kaum.' — All festivals in Malaysia are celebrated together regardless of race."
        ),
        "metadata": {"type": "culture", "level": "A2", "topic": "Deepavali and Wesak"},
    },
    # ── Pantun: Malay Poetry (B1/B2) ──────────────────────────────────────────
    {
        "content": (
            "Pantun is a traditional Malay poetic form with four lines. "
            "Structure: The first two lines (pembayang/shadow) are about nature, the last two lines (maksud/meaning) carry the actual message. Both pairs rhyme (ABAB or AABB). "
            "Example pantun: "
            "'Pisang emas dibawa belayar, / Masak sebiji di atas peti; / Hutang emas boleh dibayar, / Hutang budi dibawa mati.' "
            "Translation: 'Golden bananas taken on a voyage, / One ripens on top of a chest; / A debt of gold can be repaid, / A debt of gratitude is carried to death.' "
            "Meaning: Material debts can be paid, but kindness must be remembered forever. "
            "Pantun is used in weddings, formal speeches, and poetry competitions. It is an important part of Malay cultural heritage. "
            "'Pantun empat kerat' = four-line pantun (most common form)."
        ),
        "metadata": {"type": "culture", "level": "B1", "topic": "pantun"},
    },
    # ── Numbers: Classifiers (A2/B1) ──────────────────────────────────────────
    {
        "content": (
            "Malay uses numerical classifiers (penjodoh bilangan) between numbers and nouns. "
            "'Orang' for people: 'tiga orang pelajar' = three students. "
            "'Ekor' for animals: 'dua ekor kucing' = two cats. "
            "'Buah' for round/large objects: 'sebuah rumah' (one house), 'dua buah kereta' (two cars). Note: 'sebuah' = se + buah = one [buah]. "
            "'Batang' for long cylindrical objects: 'sebatang pen' = one pen. 'tiga batang pokok' = three trees. "
            "'Helai' for flat/thin objects: 'dua helai kertas' = two pieces of paper. 'sehelai baju' = one shirt. "
            "'Biji' for small round objects: 'tiga biji epal' = three apples. "
            "'Keping' for flat pieces: 'dua keping roti' = two slices of bread. "
            "Example: 'Saya ada dua orang adik, seekor kucing, dan sebuah kereta.' — I have two younger siblings, one cat, and one car."
        ),
        "metadata": {"type": "grammar", "level": "A2", "topic": "numerical classifiers"},
    },
    # ── Expressing Likes and Dislikes (A2) ────────────────────────────────────
    {
        "content": (
            "Expressing preferences in Malay: "
            "'Saya suka [noun/verb]' = I like [noun/activity]. "
            "'Saya tidak suka' = I don't like. 'Saya benci' = I hate. "
            "'Saya gemar' = I enjoy/I'm fond of (slightly more formal than suka). "
            "'Kegemaran saya' = my hobby/favourite thing. "
            "'Apa hobi awak?' = What is your hobby? 'Hobi saya membaca buku' = My hobby is reading books. "
            "'Saya berminat dengan...' = I am interested in... (e.g. 'Saya berminat dengan bahasa Melayu'). "
            "'Saya kurang suka' = I don't really like (softer than tidak suka). "
            "Example: 'Saya sangat suka menonton filem, tetapi saya kurang suka bermain sukan.' — I really like watching movies, but I don't really like playing sports."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "likes and dislikes"},
    },
    # ── Describing People (A2) ────────────────────────────────────────────────
    {
        "content": (
            "Describing a person's appearance in Malay: "
            "'Tinggi' = tall. 'Rendah/pendek' = short. 'Gemuk/besar' = fat/large. 'Kurus/kecik' = thin/slim. "
            "'Cantik' = beautiful (usually for women). 'Kacak/tampan' = handsome (usually for men). "
            "'Rambut panjang' = long hair. 'Rambut pendek' = short hair. 'Rambut ikal' = curly hair. 'Rambut lurus' = straight hair. "
            "'Berkulit cerah' = fair-skinned. 'Berkulit gelap' = dark-skinned. "
            "'Berumur' = aged/elderly. 'Muda' = young. 'Tua' = old. "
            "Describing personality: 'peramah' (friendly), 'pemalu' (shy), 'jujur' (honest), 'rajin' (hardworking), 'kreatif' (creative). "
            "Example: 'Pensyarah saya seorang wanita tinggi berambut pendek yang sangat peramah dan sabar.' — My lecturer is a tall woman with short hair who is very friendly and patient."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "describing people"},
    },
    # ── Common Malay Phrases (A1/A2) ──────────────────────────────────────────
    {
        "content": (
            "Essential everyday Malay phrases: "
            "'Tolong' = Help / Please. 'Terima kasih' = Thank you. 'Sama-sama' = You're welcome. "
            "'Maaf' = Sorry / Excuse me. 'Tidak apa-apa' = It's okay / Never mind. "
            "'Sila masuk' = Please come in. 'Silakan' = Please (go ahead/help yourself). "
            "'Sebentar lagi' = In a moment / Just a moment. 'Tunggu sekejap' = Wait a moment. "
            "'Saya faham' = I understand. 'Saya tidak faham' = I don't understand. "
            "'Boleh ulang semula?' = Can you repeat that? 'Cakap perlahan sikit boleh?' = Can you speak a little slower? "
            "'Di mana tandas?' = Where is the toilet? 'Di mana kaunter?' = Where is the counter? "
            "Example: 'Maaf, boleh cakap perlahan sikit? Saya baru belajar bahasa Melayu.' — Sorry, could you speak a little slower? I am just learning Malay."
        ),
        "metadata": {"type": "vocabulary", "level": "A1", "topic": "common phrases"},
    },
    # ── Expressing Quantity (A2) ──────────────────────────────────────────────
    {
        "content": (
            "Expressing quantity in Malay: "
            "'Banyak' = many/a lot (of). 'Sedikit/sikit' = a little/few. "
            "'Semua' = all/every. 'Beberapa' = some/several. 'Tiada/tidak ada' = none/there is no. "
            "'Cukup/mencukupi' = enough. 'Lebih' = more/extra. 'Kurang' = less/fewer. "
            "'Separuh' = half. 'Suku' = a quarter. "
            "'Banyak sangat' = too many/too much. 'Sikit sangat/terlalu sikit' = too few/too little. "
            "'Ada berapa?' = How many are there? 'Ada berapa orang?' = How many people are there? "
            "Example: 'Saya ada beberapa soalan. Boleh awak berikan saya sedikit masa untuk bertanya?' — I have some questions. Can you give me a little time to ask?"
        ),
        "metadata": {"type": "grammar", "level": "A2", "topic": "quantity"},
    },
    # ── At the Hospital / Clinic (A2/B1) ──────────────────────────────────────
    {
        "content": (
            "Useful Malay for medical situations: "
            "'Saya tidak sihat / Saya sakit' = I am not well / I am sick. "
            "'Saya perlu jumpa doktor' = I need to see a doctor. 'Klinik' = clinic. 'Hospital' = hospital. "
            "'Saya ada demam' = I have a fever. 'Saya ada batuk' = I have a cough. "
            "'Saya rasa loya/mual' = I feel nauseous. 'Saya sakit dada' = I have chest pain. "
            "'Doktor, di sini sakit' = Doctor, it hurts here. "
            "'Ubat' = medicine. 'Makan ubat tiga kali sehari' = take medicine three times a day. "
            "'Berehat yang cukup' = get enough rest. 'Minum air banyak-banyak' = drink plenty of water. "
            "Emergency: 'Tolong! Ini kecemasan!' = Help! This is an emergency! "
            "Example: 'Doktor, saya ada demam sejak dua hari lepas dan kepala saya sakit sangat.' — Doctor, I have had a fever for two days and my head hurts a lot."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "health and medical"},
    },
    # ── At the Bank / Post Office (A2) ────────────────────────────────────────
    {
        "content": (
            "Banking and postal vocabulary in Malay: "
            "Bank: 'akaun bank' (bank account), 'wang' (money), 'ringgit' (Malaysian currency, RM), "
            "'sen' (cent, 100 sen = 1 ringgit), 'wang tunai' (cash), 'cek' (cheque), "
            "'ATM/mesin pengeluaran wang' (ATM), 'pindah wang' (transfer money). "
            "'Saya nak buka akaun' = I want to open an account. "
            "'Saya nak keluarkan duit' = I want to withdraw money. "
            "Post office: 'pejabat pos' (post office), 'setem' (stamp), 'sampul surat' (envelope), "
            "'bungkusan/pakej' (parcel/package), 'pos laju' (express mail). "
            "'Saya nak hantar bungkusan ke Johor Bahru' = I want to send a parcel to JB. "
            "Example: 'Saya pergi ke pejabat pos untuk hantar bungkusan dan beli setem.' — I went to the post office to send a parcel and buy stamps."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "bank and post office"},
    },
    # ── Giving Opinions (B1) ──────────────────────────────────────────────────
    {
        "content": (
            "Expressing opinions in Malay: "
            "'Pada pendapat saya...' = In my opinion... (formal). "
            "'Saya rasa/fikir...' = I think/feel... (less formal). "
            "'Saya bersetuju dengan...' = I agree with... "
            "'Saya tidak bersetuju dengan...' = I disagree with... "
            "'Saya kurang pasti' = I am not quite sure. "
            "'Menurut saya...' = According to me... (formal). "
            "'Sebenarnya...' = Actually/In fact... "
            "'Perkara ini penting kerana...' = This matter is important because... "
            "'Walau bagaimanapun...' = However... (formal, used to contrast). "
            "Example: 'Pada pendapat saya, belajar bahasa kedua sangat bermanfaat kerana ia membuka lebih banyak peluang.' — In my opinion, learning a second language is very beneficial because it opens more opportunities."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "expressing opinions"},
    },
    # ── Future Plans & Ambitions (A2/B1) ─────────────────────────────────────
    {
        "content": (
            "Expressing future plans and ambitions in Malay: "
            "'Saya bercita-cita untuk menjadi...' = I aspire/dream to become... "
            "'Saya berhasrat untuk...' = I intend/desire to... (formal). "
            "'Rancangan saya...' = My plan is... "
            "'Selepas tamat pengajian...' = After finishing my studies... "
            "'Saya akan berusaha untuk...' = I will strive to... "
            "Professions: doktor (doctor), jurutera (engineer), guru (teacher), peguam (lawyer), arkitek (architect), ahli perniagaan (businessman), saintis (scientist), artis (artist). "
            "Example: 'Saya bercita-cita untuk menjadi jurutera perisian. Selepas tamat pengajian, saya akan mencari pekerjaan di syarikat teknologi.' — I aspire to become a software engineer. After finishing my studies, I will look for a job at a technology company."
        ),
        "metadata": {"type": "vocabulary", "level": "B1", "topic": "future plans"},
    },
    # ── Passive Voice with 'oleh' (B1) ────────────────────────────────────────
    {
        "content": (
            "The passive voice in Malay uses the di- prefix and 'oleh' (by). "
            "There is also a second passive form for first and second person: the verb has no prefix. "
            "Active (third person): 'Dia menghantar surat itu' = He sent the letter. "
            "Passive with di-: 'Surat itu dihantar oleh dia' = The letter was sent by him. "
            "Passive with first/second person: 'Surat itu saya hantar' = I sent the letter (lit. The letter, I sent). "
            "'Buku ini awak tulis?' = Did you write this book? (lit. This book, you wrote?) "
            "The di- passive is more formal and common in writing. "
            "The pronoun-as-agent passive is more common in speech. "
            "Example: 'Projek ini kami siapkan dalam masa tiga hari.' — We completed this project in three days. (lit. This project, we completed...)"
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "passive voice"},
    },
    # ── Relative Clauses with 'yang' (A2/B1) ─────────────────────────────────
    {
        "content": (
            "The word 'yang' in Malay functions as a relative pronoun equivalent to 'who', 'which', or 'that' in English. "
            "'Pelajar yang rajin' = the student who is hardworking. "
            "'Buku yang saya beli' = the book that I bought. "
            "'Rumah yang besar itu' = that big house (yang emphasises the adjective). "
            "'Yang mana satu?' = Which one? "
            "'Yang ini' = this one. 'Yang itu' = that one. "
            "Yang is extremely versatile — it links a noun with a relative clause or emphasises a descriptor. "
            "Example: 'Pensyarah yang mengajar saya bahasa Melayu adalah orang yang sangat sabar dan baik hati.' — The lecturer who teaches me Malay is a very patient and kind-hearted person."
        ),
        "metadata": {"type": "grammar", "level": "A2", "topic": "relative pronoun yang"},
    },
    # ── Conditional Sentences (B1) ────────────────────────────────────────────
    {
        "content": (
            "Conditional sentences in Malay use 'kalau', 'jika', or 'sekiranya' (formal): "
            "'Kalau/Jika [condition], [result]' = If [condition], [result]. "
            "'Kalau hujan, saya tidak akan keluar' = If it rains, I will not go out. "
            "'Jika awak belajar bersungguh-sungguh, awak akan lulus peperiksaan' = If you study hard, you will pass the exam. "
            "Hypothetical (unlikely): 'Kalau sekiranya saya kaya, saya akan beli rumah besar' = If I were rich, I would buy a big house. "
            "'Dengan syarat' = on the condition that: 'Saya akan tolong, dengan syarat awak tolong saya juga' = I will help, on the condition that you also help me. "
            "'Seandainya' = if only/if it were the case that (very formal/literary). "
            "Example: 'Jika awak tidak faham, tanya sahaja. Pensyarah akan gembira membantu.' — If you don't understand, just ask. The lecturer will be happy to help."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "conditional sentences"},
    },
    # ── Vocabulary: Technology (A2/B1) ────────────────────────────────────────
    {
        "content": (
            "Technology vocabulary in Malay: "
            "komputer (computer), telefon bimbit/handphone (mobile phone), tablet (tablet), "
            "internet (internet), e-mel/emel (email), laman web (website), aplikasi/app (application), "
            "media sosial (social media), kata laluan (password), nama pengguna (username), "
            "muat turun (download), muat naik (upload), menghantar mesej (send a message), "
            "pengecas (charger), bateri (battery), Wi-Fi (Wi-Fi), Bluetooth (Bluetooth). "
            "'Sambungan internet' = internet connection. 'Isyarat lemah' = weak signal. "
            "Common tech phrases: 'Laman web ini tidak dapat diakses' = This website cannot be accessed. "
            "'Telefon saya kehabisan bateri' = My phone's battery is dead/ran out. "
            "Example: 'Saya perlu muat turun aplikasi ini dan daftar menggunakan emel saya.' — I need to download this app and register using my email."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "technology"},
    },
    # ── Vocabulary: Nature & Environment (B1) ─────────────────────────────────
    {
        "content": (
            "Nature and environment vocabulary in Malay: "
            "hutan (forest), sungai (river), tasik (lake), laut (sea), pantai (beach), bukit (hill), gunung (mountain), "
            "pulau (island), padang (field/plain), sawah (paddy field), ladang (plantation/farm). "
            "Flora: pokok (tree), bunga (flower), rumput (grass), daun (leaf), akar (root), benih (seed). "
            "Fauna: harimau (tiger), gajah (elephant), orang utan (orang utan), beruang (bear), ular (snake), burung (bird). "
            "Environmental issues: 'pencemaran' (pollution), 'pemanasan global' (global warming), 'pembalakan haram' (illegal logging), 'pelestarian alam' (environmental conservation). "
            "Example: 'Malaysia terkenal dengan hutan hujan tropika yang kaya dengan kepelbagaian hidupan liar.' — Malaysia is famous for its tropical rainforests rich in biodiversity."
        ),
        "metadata": {"type": "vocabulary", "level": "B1", "topic": "nature and environment"},
    },
    # ── Sports & Hobbies (A2) ─────────────────────────────────────────────────
    {
        "content": (
            "Sports and hobbies vocabulary in Malay: "
            "bola sepak (football/soccer), bola keranjang (basketball), badminton (badminton — very popular in Malaysia!), "
            "berenang (swimming), berlari (running), mendaki gunung (mountain climbing), memancing (fishing), "
            "memasak (cooking), melukis (drawing/painting), membaca (reading), menyanyi (singing), "
            "bermain muzik (playing music), mengembara (travelling/exploring). "
            "'Bermain' = to play (sports/games). 'Berlatih' = to practise/train. "
            "Malaysia's national sport is sepak takraw (a ball sport using rattan ball) and badminton is extremely popular (Malaysia has produced world champions). "
            "Example: 'Hobi saya ialah bermain badminton pada hujung minggu bersama rakan-rakan.' — My hobby is playing badminton on weekends with friends."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "sports and hobbies"},
    },
    # ── Vocabulary: Professions (A2/B1) ───────────────────────────────────────
    {
        "content": (
            "Professions and occupations in Malay: "
            "doktor (doctor), jururawat (nurse), guru/cikgu (school teacher), pensyarah (university lecturer), "
            "peguam (lawyer), jurutera (engineer), akauntan (accountant), arkitek (architect), "
            "peniaga/ahli perniagaan (businessman/businesswoman), petani (farmer), nelayan (fisherman), "
            "pemandu (driver), pegawai polis (police officer), askar (soldier), wartawan (journalist), "
            "chef/tukang masak (chef/cook), doktor gigi (dentist), ahli farmasi (pharmacist). "
            "'Saya bekerja sebagai...' = I work as... "
            "'Apakah pekerjaan awak?' = What is your job/occupation? "
            "Example: 'Bapa saya seorang jurutera dan ibu saya bekerja sebagai jururawat di hospital kerajaan.' — My father is an engineer and my mother works as a nurse at a government hospital."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "professions"},
    },
    # ── Expressing Agreement & Disagreement (B1) ──────────────────────────────
    {
        "content": (
            "Agreeing and disagreeing in Malay: "
            "Agreement: 'Betul/benar' (true/correct), 'Setuju' (agree), 'Memang' (indeed/certainly), "
            "'Saya rasa awak betul' (I think you are right), 'Tepat sekali' (exactly/absolutely right). "
            "Disagreement: 'Tidak setuju' (disagree), 'Saya rasa tidak begitu' (I don't think so), "
            "'Maaf, saya tidak sependapat' (Sorry, I don't share the same opinion — formal), "
            "'Sebenarnya...' (Actually... — used to politely contradict). "
            "Partial agreement: 'Ada betulnya juga' (There is some truth to that), "
            "'Saya faham maksud awak, tetapi...' (I understand what you mean, but...). "
            "Example: 'Saya setuju bahawa belajar bahasa penting, tetapi saya rasa cara pembelajaran juga sama pentingnya.' — I agree that learning language is important, but I think the learning method is equally important."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "agreement and disagreement"},
    },
    # ── Writing Formal Letters (B1/B2) ───────────────────────────────────────
    {
        "content": (
            "Format for a formal Malay letter (surat rasmi): "
            "Opening: 'Tuan/Puan,' or 'Yang Berbahagia Dato'...' for senior officials. "
            "Subject line: 'Perkara: [topic]' (RE: [topic]). "
            "Opening paragraph: 'Dengan hormatnya, saya ingin merujuk kepada perkara di atas.' (With respect, I would like to refer to the above matter.) "
            "Closing: 'Sekian, terima kasih.' (That is all, thank you.) "
            "'Yang benar,' = Yours sincerely. 'Yang ikhlas,' = Yours faithfully. "
            "Common formal phrases: 'bersempena dengan' (in conjunction with), 'adalah dimaklumkan bahawa' (it is hereby informed that), 'dengan segala hormat' (with all due respect). "
            "Example of opening: 'Tuan, Dengan hormatnya saya merujuk kepada pengumuman kekosongan jawatan di syarikat tuan bertarikh 1 Mac 2026.'"
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "formal letter writing"},
    },
    # ── Vocabulary: Food at a Warung/Kedai (A2) ───────────────────────────────
    {
        "content": (
            "Common Malaysian dishes and where to find them: "
            "'Warung' = small roadside food stall. 'Restoran' = restaurant. 'Gerai' = food stall (in market or food court). "
            "'Nasi lemak' = coconut milk rice with sambal, peanuts, anchovies, egg and cucumber — national dish. "
            "'Mee goreng' = fried noodles. 'Nasi goreng' = fried rice. 'Roti canai' = flaky flatbread with curry dip. "
            "'Teh tarik' = pulled tea (frothy milk tea — Malaysian favourite). 'Kopi-O' = black coffee. "
            "'Satay' = grilled skewered meat with peanut sauce. 'Kuih' = traditional Malay cakes/snacks. "
            "'Makan tengah hari' = lunch. 'Makan malam' = dinner. 'Sarapan' = breakfast. "
            "Example: 'Setiap pagi saya makan nasi lemak dan minum teh tarik untuk sarapan.' — Every morning I eat nasi lemak and drink teh tarik for breakfast."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "Malaysian food"},
    },
    # ── Expressing Obligation (B1) ────────────────────────────────────────────
    {
        "content": (
            "Expressing obligation and necessity in Malay: "
            "'Mesti/harus' = must/should (strong obligation): 'Awak mesti datang tepat masa' = You must come on time. "
            "'Perlu/kena' = need to (softer obligation): 'Saya perlu hantar tugasan ini hari ini' = I need to submit this assignment today. "
            "'Wajib' = compulsory/obligatory (often for religious or official duties): 'Solat lima waktu wajib bagi orang Islam' = Five-time daily prayer is compulsory for Muslims. "
            "'Digalakkan' = encouraged (not compulsory but recommended): 'Digalakkan hadir ke semua kuliah' = Attending all lectures is encouraged. "
            "'Dilarang' = prohibited/forbidden: 'Dilarang merokok di sini' = Smoking is prohibited here. "
            "Example: 'Semua pelajar mesti mendaftar sebelum jam sembilan pagi dan wajib hadir ke taklimat pertama.' — All students must register before nine o'clock and are required to attend the first briefing."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "expressing obligation"},
    },
    # ── Linking Words for Essays (B1/B2) ──────────────────────────────────────
    {
        "content": (
            "Discourse markers and linking words used in Malay essays and formal speech: "
            "Adding information: 'selain itu' (besides that), 'tambahan pula' (furthermore), 'di samping itu' (in addition to that). "
            "Contrasting: 'walau bagaimanapun' (however), 'sebaliknya' (on the other hand/conversely), 'walaupun demikian' (even so/nevertheless). "
            "Cause & effect: 'oleh sebab itu' (therefore/because of that), 'dengan itu' (thereby), 'natijahnya' (as a result — formal). "
            "Sequence: 'pertama sekali' (first of all), 'seterusnya' (next/subsequently), 'akhir sekali/kesimpulannya' (finally/in conclusion). "
            "Emphasis: 'malah' (in fact/even), 'bahkan' (in fact/even more so), 'sesungguhnya' (truly/indeed — literary). "
            "Example: 'Pertama sekali, bahasa Melayu adalah bahasa kebangsaan Malaysia. Tambahan pula, ia digunakan sebagai bahasa pengantar di sekolah kebangsaan.' — First of all, Malay is the national language of Malaysia. Furthermore, it is used as the medium of instruction in national schools."
        ),
        "metadata": {"type": "grammar", "level": "B1", "topic": "essay linking words"},
    },
    # ── Vocabulary: At the University (A2) ────────────────────────────────────
    {
        "content": (
            "University life vocabulary in Malay: "
            "'Mendaftar' = to register/enrol. 'Jadual waktu' = timetable. 'Kuliah' = lecture. "
            "'Tutorial' = tutorial/discussion class. 'Makmal' = laboratory. 'Bengkel' = workshop/seminar. "
            "'Dekan' = dean. 'Naib Canselor' = Vice Chancellor. 'Jabatan' = department. 'Fakulti' = faculty. "
            "'Yuran' = fees/tuition. 'Biasiswa' = scholarship. 'Pinjaman' = loan. "
            "'Projek akhir tahun' = final year project. 'Tesis' = thesis/dissertation. "
            "'Graduasi/konvokesyen' = graduation/convocation. 'Ijazah' = degree. "
            "'Ijazah Sarjana Muda' = Bachelor's degree. 'Sarjana' = Master's. 'Doktor Falsafah (PhD)' = PhD. "
            "Example: 'Saya sedang menyiapkan projek akhir tahun saya untuk mendapatkan ijazah sarjana muda.' — I am completing my final year project to obtain my bachelor's degree."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "university life"},
    },
    # ── Summary: Tense Markers (A2) ───────────────────────────────────────────
    {
        "content": (
            "Summary of tense markers in Malay (Malay has no verb conjugation — time is shown by these markers): "
            "Past: 'sudah/telah' (completed action), 'semalam' (yesterday), 'tadi' (just now/earlier today), 'minggu lepas' (last week). "
            "Present/Ongoing: 'sedang' (right now, in progress), 'masih' (still doing). "
            "Future: 'akan' (will/going to), 'esok' (tomorrow), 'minggu depan' (next week), 'nanti' (later). "
            "Habitual: 'selalu/biasanya' (usually/always). "
            "Examples: "
            "'Saya sudah makan' = I have already eaten. "
            "'Saya sedang makan' = I am (currently) eating. "
            "'Saya akan makan' = I will eat. "
            "'Saya biasanya makan pukul satu tengah hari' = I usually eat at one in the afternoon. "
            "'Saya baru makan tadi' = I just ate a moment ago."
        ),
        "metadata": {"type": "grammar", "level": "A2", "topic": "tense markers"},
    },
    # ── Vocabulary: At the Airport (A2) ──────────────────────────────────────
    {
        "content": (
            "Useful Malay for airports and travel: "
            "'Lapangan terbang / Lapangan Terbang Antarabangsa' = airport / international airport. "
            "'Penerbangan' = flight. 'Tiket penerbangan' = flight ticket. "
            "'Daftar masuk / check-in' = check-in. 'Laluan kemasukan / imigresen' = immigration. "
            "'Kastam' = customs. 'Barang-barang' = luggage/belongings. 'Bagasi' = baggage. "
            "'Pintu masuk / gate' = boarding gate. 'Boarding pass' = pas menaiki pesawat. "
            "'Penerbangan tertangguh' = delayed flight. 'Dibatalkan' = cancelled. "
            "'Di mana kaunter daftar masuk untuk penerbangan ke...?' = Where is the check-in counter for the flight to...? "
            "Example: 'Saya tiba di lapangan terbang dua jam awal untuk menyelesaikan proses imigresen.' — I arrived at the airport two hours early to complete the immigration process."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "airport and travel"},
    },
    # ── Malaysian Slang & Casual Speech (B1) ─────────────────────────────────
    {
        "content": (
            "Common Malaysian Malay informal expressions and slang: "
            "'Alamak' = Oh no! / Oh my! (mild exclamation of dismay). "
            "'Wah/Wow' = Wow! (amazement). "
            "'Eh' = Hey / Oi (getting attention informally). "
            "'Boleh tahan' = Not bad / Pretty good (lit. can tolerate/endure). "
            "'Cincai' (Chinese loanword) = Just okay / anything goes / don't fuss. "
            "'Lepak' = to hang out/chill (do nothing in a relaxed way). 'Lepaking' = chilling out. "
            "'Makan angin' = to go on holiday/outing (lit. eating air). "
            "'Goyang kaki' = to be idle/lazy (lit. swinging your legs). "
            "'Pokai' = broke/no money. 'Senang lenang' = carefree and comfortable. "
            "These expressions are characteristic of everyday Malaysian spoken Malay and should be avoided in formal writing. "
            "Example: 'Alamak, saya terlupa bawa dompet! Pokai lah saya hari ini.' — Oh no, I forgot to bring my wallet! I'm broke today."
        ),
        "metadata": {"type": "culture", "level": "B1", "topic": "Malaysian slang"},
    },
    # ── Vocabulary: Media & News (B1/B2) ─────────────────────────────────────
    {
        "content": (
            "Media and current affairs vocabulary in Malay: "
            "'Berita' = news. 'Akhbar' = newspaper. 'Majalah' = magazine. 'Televisyen' = television. "
            "'Radio' = radio. 'Siaran' = broadcast. 'Rancangan' = programme. "
            "'Wartawan/jurnalis' = journalist. 'Pemberita' = news anchor/reporter. "
            "'Peristiwa' = event/incident. 'Kejadian' = occurrence. 'Laporan' = report. "
            "'Politik' = politics. 'Ekonomi' = economy. 'Sukan' = sports. 'Hiburan' = entertainment. "
            "'Kerajaan' = government. 'Pembangkang' = opposition. 'Parlimen' = parliament. "
            "'Pilihan raya' = election. 'Undang-undang' = law. "
            "Example: 'Saya membaca akhbar setiap pagi untuk mengikuti berita semasa dalam dan luar negara.' — I read the newspaper every morning to follow current news both locally and internationally."
        ),
        "metadata": {"type": "vocabulary", "level": "B1", "topic": "media and news"},
    },
    # ── National Identity: Bahasa Melayu (A2/B1) ─────────────────────────────
    {
        "content": (
            "Bahasa Melayu as the national language of Malaysia: "
            "Bahasa Melayu (also known as Bahasa Malaysia) is the official national language (bahasa kebangsaan) of Malaysia, as enshrined in Article 152 of the Malaysian Constitution. "
            "It is used in government, education, courts, and official communications. "
            "The standard form is based on the Johor-Riau dialect and was standardised through collaboration between Malaysia, Indonesia, and Brunei. "
            "In Indonesia, the language is called 'Bahasa Indonesia' — it is mutually intelligible with Bahasa Malaysia with minor vocabulary and spelling differences. "
            "'Bahasa jiwa bangsa' = Language is the soul of a nation (well-known Malay saying). "
            "Learning Bahasa Melayu helps you connect with over 290 million speakers across Malaysia, Indonesia, Brunei, and parts of Singapore, the Philippines, and Thailand. "
            "Example: 'Bahasa Melayu bukan sahaja penting untuk berkomunikasi di Malaysia, malah ia adalah kunci untuk memahami budaya dan identiti rakyat Malaysia.' — Malay is not only important for communication in Malaysia, but it is also the key to understanding the culture and identity of Malaysians."
        ),
        "metadata": {"type": "culture", "level": "B1", "topic": "Bahasa Melayu national language"},
    },
    # ── IPA Pronunciation Guide — Greetings & Common Words (A1) ─────────────────
    {
        "content": (
            "IPA pronunciation guide for common Malaysian Malay greetings and everyday words. "
            "IPA uses dots to separate syllables and slashes /.../ to mark pronunciation. "
            "'Selamat pagi' (good morning) — IPA: /sə.la.mat pa.gi/ — sounds like: suh-LAH-mat PAH-ghee. "
            "'Selamat malam' (good night) — IPA: /sə.la.mat ma.lam/ — sounds like: suh-LAH-mat MAH-lam. "
            "'Terima kasih' (thank you) — IPA: /tə.ri.ma ka.sɪh/ — sounds like: tuh-REE-mah KAH-sih. "
            "'Sama-sama' (you're welcome) — IPA: /sa.ma sa.ma/ — sounds like: SAH-mah SAH-mah. "
            "'Apa khabar' (how are you) — IPA: /a.pa xa.bar/ — sounds like: AH-pah KHA-bar (kh is a soft throat sound). "
            "'Khabar baik' (I'm fine) — IPA: /xa.bar baɪk/ — sounds like: KHA-bar BIKE. "
            "'Maaf' (sorry/excuse me) — IPA: /ma.ʔaf/ — sounds like: MAH-af. "
            "'Tolong' (please/help) — IPA: /to.loŋ/ — sounds like: TOH-long. "
            "Key pronunciation rules in Malaysian Malay: "
            "The letter 'e' has two sounds — schwa /ə/ (like 'uh' in 'about') in unstressed syllables, "
            "and full /e/ (like 'eh') in stressed syllables. "
            "The letter 'a' is always /a/ as in 'father', never as in 'cat'. "
            "The letter 'i' is always /i/ as in 'machine'. "
            "The letter 'u' is always /u/ as in 'moon'. "
            "'ng' is a single sound /ŋ/ as in 'sing' — it can appear at the start of a word in Malay. "
            "'ny' is /ɲ/ as in 'canyon'. "
            "'kh' is a velar fricative /x/ like the 'ch' in Scottish 'loch'."
        ),
        "metadata": {"type": "pronunciation", "level": "A1", "topic": "IPA pronunciation greetings"},
    },
    # ── IPA Pronunciation — Numbers 0–10 (A1) ────────────────────────────────────
    {
        "content": (
            "IPA pronunciation guide for Malaysian Malay numbers 0–10. "
            "In Malaysian Malay, zero is 'kosong' /ko.soŋ/ (NOT 'sifar' or 'nol' which are Indonesian). "
            "'Satu' (one) — IPA: /sa.tu/ — sounds like: SAH-too. "
            "'Dua' (two) — IPA: /du.a/ — sounds like: DOO-ah. "
            "'Tiga' (three) — IPA: /ti.ga/ — sounds like: TEE-gah. "
            "'Empat' (four) — IPA: /əm.pat/ — sounds like: um-PAT. "
            "'Lima' (five) — IPA: /li.ma/ — sounds like: LEE-mah. "
            "'Enam' (six) — IPA: /ə.nam/ — sounds like: uh-NAM. "
            "'Tujuh' (seven) — IPA: /tu.dʒuh/ — sounds like: too-JOO. "
            "'Lapan' (eight) — IPA: /la.pan/ — sounds like: LAH-pan. "
            "'Sembilan' (nine) — IPA: /səm.bi.lan/ — sounds like: sum-BEE-lan. "
            "'Sepuluh' (ten) — IPA: /sə.pu.luh/ — sounds like: suh-POO-luh. "
            "Numbers 11–19: add 'belas' — 'sebelas' (11) /sə.bə.las/, 'dua belas' (12) /du.a bə.las/. "
            "Numbers 20, 30… use 'puluh': 'dua puluh' (20) /du.a pu.luh/, 'tiga puluh' (30). "
            "'Seratus' (one hundred) — IPA: /sə.ra.tus/ — sounds like: suh-RAH-toos. "
            "'Seribu' (one thousand) — IPA: /sə.ri.bu/ — sounds like: suh-REE-boo."
        ),
        "metadata": {"type": "pronunciation", "level": "A1", "topic": "IPA pronunciation numbers"},
    },
    # ── IPA Pronunciation — Common Verbs & Daily Life (A1) ───────────────────────
    {
        "content": (
            "IPA pronunciation guide for common Malaysian Malay verbs and daily-life vocabulary. "
            "'Makan' (eat) — IPA: /ma.kan/ — sounds like: MAH-kan. "
            "'Minum' (drink) — IPA: /mi.num/ — sounds like: MEE-noom. "
            "'Pergi' (go) — IPA: /pər.gi/ — sounds like: pur-GHEE. "
            "'Datang' (come) — IPA: /da.taŋ/ — sounds like: DAH-tang. "
            "'Beli' (buy) — IPA: /bə.li/ — sounds like: buh-LEE. "
            "'Kerja' (work) — IPA: /kər.dʒa/ — sounds like: ker-JAH. "
            "'Tidur' (sleep) — IPA: /ti.dur/ — sounds like: TEE-door. "
            "'Bangun' (wake up) — IPA: /ba.ŋun/ — sounds like: BAH-goon. "
            "'Belajar' (study/learn) — IPA: /bə.la.dʒar/ — sounds like: buh-LAH-jar. "
            "'Faham' (understand) — IPA: /fa.ham/ — sounds like: FAH-hum. "
            "Common nouns with IPA: "
            "'Rumah' (house) — /ru.mah/ — ROO-mah. "
            "'Sekolah' (school) — /sə.ko.lah/ — suh-KOH-lah. "
            "'Kereta' (car) — /kə.re.ta/ — kuh-REH-tah (Malaysian Malay; NOT 'mobil' which is Indonesian). "
            "'Pasar' (market) — /pa.sar/ — PAH-sar. "
            "'Makanan' (food) — /ma.ka.nan/ — mah-KAH-nan. "
            "'Minuman' (drink/beverage) — /mi.nu.man/ — mee-NOO-man."
        ),
        "metadata": {"type": "pronunciation", "level": "A1", "topic": "IPA pronunciation verbs daily life"},
    },
    # ── Malaysian Malay vs Indonesian Malay — Key Differences (A2) ──────────────
    {
        "content": (
            "Key vocabulary differences between Malaysian Bahasa Melayu and Indonesian Bahasa Indonesia. "
            "Always use the MALAYSIAN form when learning or teaching Bahasa Melayu in Malaysia. "
            "Zero: Malaysian 'kosong' /ko.soŋ/ — Indonesian 'nol'/'sifar' (do NOT use in Malaysia). "
            "Car: Malaysian 'kereta' /kə.re.ta/ — Indonesian 'mobil'. "
            "Bus: Malaysian 'bas' /bas/ — Indonesian 'bis'. "
            "Phone: Malaysian 'telefon' /tə.le.fon/ — Indonesian 'ponsel'. "
            "Train: Malaysian 'kereta api' or 'tren' — Indonesian 'kereta api'/'kereta'. "
            "Hospital: Malaysian 'hospital' /hos.pi.tal/ — Indonesian 'rumah sakit'. "
            "Want: Malaysian 'mahu' /ma.hu/ — Indonesian 'mau'. "
            "You (informal): Malaysian 'awak' /a.wak/ or 'kamu' /ka.mu/ — Indonesian 'kamu'/'lo'. "
            "I/me (informal): Malaysian 'saya' /sa.ya/ or 'aku' /a.ku/ — Indonesian same. "
            "Can: Malaysian 'boleh' /bo.leh/ — Indonesian 'bisa'. "
            "Must: Malaysian 'mesti'/'kena' — Indonesian 'harus'. "
            "Good/Nice: Malaysian 'bagus' /ba.gus/ — both use 'bagus' but Malaysian also uses 'baik'. "
            "Spelling note: Malaysian Malay uses 'e' where Indonesian uses 'a' in some words: "
            "Malaysian 'empat' (four) — Indonesian 'empat' (same here); "
            "Malaysian 'mereka' — Indonesian 'mereka' (same); "
            "but Malaysian 'cendawan' (mushroom) — Indonesian 'jamur'. "
            "Both share most core grammar and vocabulary but these key differences matter for authenticity."
        ),
        "metadata": {"type": "vocabulary", "level": "A2", "topic": "Malaysian vs Indonesian Malay differences"},
    },
]
