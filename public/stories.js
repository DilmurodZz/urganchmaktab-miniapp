// "Universitetlar haqida qiziqarli ma'lumotlar": short facts, history, results and true motivational stories
// about the world's top universities. A ribbon on top of Foydali vositalar slides every 6 seconds; a tap opens
// the story, "Barchasi" opens the list. Each text is written in uz, ru and en (no server needed); a short fact
// stays short, a story takes at most about two minutes to read. Unread stories show as a badge on the Home tile.
const Stories = (() => {
  const K = { fact: ["Fakt", "Факт", "Fact", "sparkles"], hist: ["Tarix", "История", "History", "book"], res: ["Natija", "Результат", "Results", "chart"],
    story: ["Hikoya", "История успеха", "Story", "star"], tip: ["Maslahat", "Совет", "Tip", "target"] };
  const L = LANG === "ru" ? 1 : LANG === "en" ? 2 : 0;
  // the holiday that is coming now, so the stories never say "this summer" in November
  const SEASON = (() => { const m = new Date().getMonth();
    if (m === 10 || m === 11) return ["Yaqinlashayotgan qishki va Yangi yil ta'tilini qanday o'tkazasiz?", "Как вы проведёте приближающиеся зимние и новогодние каникулы?", "How will you spend the coming winter and New Year holidays?"];
    if (m <= 1) return ["Qishki ta'tilni va qishning qolgan kunlarini qanday o'tkazasiz?", "Как вы проведёте зимние каникулы и остаток зимы?", "How will you spend the winter holidays and the rest of winter?"];
    if (m <= 3) return ["Bahorgi ta'tilni qanday o'tkazasiz?", "Как вы проведёте весенние каникулы?", "How will you spend the spring holidays?"];
    if (m <= 7) return ["Bu yozni qanday o'tkazasiz?", "Как вы проведёте это лето?", "How will you spend this summer?"];
    return ["Kuzgi ta'tilni qanday o'tkazasiz?", "Как вы проведёте осенние каникулы?", "How will you spend the autumn holidays?"]; })();
  const ALL = [
    { id: "harvard400", k: "hist", t: ["Harvard 400 ta kitobdan boshlangan", "Гарвард начался с 400 книг", "Harvard began with 400 books"], p: [
      ["1636-yilda Amerikada kichkina bir kollej ochildi. Unda bor-yo'g'i bir nechta talaba va bitta o'qituvchi bor edi.",
        "Ikki yil o'tib, yosh ruhoniy Jon Garvard kasallikdan vafot etdi. U kollejga 400 ga yaqin kitobini va mol-mulkining yarmini vasiyat qilib qoldirdi. O'sha paytda bu juda katta boylik edi.",
        "Kollej unga minnatdorchilik bildirib, uning ismini oldi. Bugun Harvard dunyoning eng mashhur universitetlaridan biri, uning kutubxonasi esa dunyodagi eng katta universitet kutubxonalaridan biri.",
        "Hammasi bitta insonning kitob javonidan boshlangan. Siz bugun o'qiyotgan kitob ham bir kun kimningdir hayotini o'zgartirishi mumkin."],
      ["В 1636 году в Америке открылся маленький колледж: несколько студентов и один преподаватель.",
        "Через два года умер молодой священник Джон Гарвард. Он завещал колледжу около 400 книг и половину своего имущества. По тем временам это было целое состояние.",
        "В благодарность колледж назвали его именем. Сегодня Гарвард один из самых известных университетов мира, а его библиотека одна из крупнейших университетских библиотек.",
        "Всё началось с книжной полки одного человека. Книга, которую вы читаете сегодня, тоже может однажды изменить чью-то жизнь."],
      ["In 1636 a tiny college opened in America: a few students and one teacher.",
        "Two years later a young minister, John Harvard, died of illness. He left the college about 400 books and half of his estate. At the time that was a fortune.",
        "To thank him, the college took his name. Today Harvard is one of the most famous universities in the world, and its library is one of the largest university libraries anywhere.",
        "It all started with one person's bookshelf. The book you read today could change someone's life one day too."]] },
    { id: "qarawiyyin", k: "hist", t: ["Dunyodagi eng qadimgi universitetga ayol asos solgan", "Старейший университет мира основала женщина", "A woman founded the world's oldest university"], p: [
      ["859-yilda Marokashning Fes shahrida Fotima al-Fihriy ismli ayol otasidan qolgan meros bilan masjid va ta'lim maskani qurdirdi.",
        "U shu ish tugaguncha har kuni ro'za tutgan ekan. Bu maskan al-Qarawiyyin deb ataldi va asrlar davomida olimlar, faylasuflar va shifokorlarni tayyorladi.",
        "YUNESKO va Ginnesning rekordlar kitobi uni bugungacha uzluksiz ishlab kelayotgan eng qadimgi ta'lim muassasasi deb tan oladi. Oksforddan ham ikki asrdan ko'proq oldin ochilgan!",
        "Bir qizning orzusi o'n bir asrdan beri yashab kelyapti. Sizning orzuingiz ham shunchalik kuchli bo'lishi mumkin."],
      ["В 859 году в марокканском городе Фес женщина по имени Фатима аль-Фихри на наследство отца построила мечеть и учебное заведение.",
        "Говорят, она постилась каждый день, пока шло строительство. Это место назвали аль-Карауин, и веками оно готовило учёных, философов и врачей.",
        "ЮНЕСКО и Книга рекордов Гиннесса признают его старейшим непрерывно действующим учебным заведением. Оно открылось более чем на два века раньше Оксфорда!",
        "Мечта одной девушки живёт уже одиннадцать веков. Ваша мечта тоже может быть такой сильной."],
      ["In 859, in the city of Fez in Morocco, a woman named Fatima al-Fihri used her father's inheritance to build a mosque and a place of learning.",
        "It is said she fasted every day until the building was finished. It was named al-Qarawiyyin, and for centuries it trained scholars, philosophers and doctors.",
        "UNESCO and Guinness World Records recognise it as the oldest educational institution still operating today. It opened more than two centuries before Oxford!",
        "One young woman's dream has lived for eleven centuries. Your dream can be that strong too."]] },
    { id: "oxford-aztec", k: "fact", t: ["Oksford atseklar davlatidan ham qadimiy", "Оксфорд старше империи ацтеков", "Oxford is older than the Aztec Empire"], p: [
      ["Oksfordda darslar 1096-yildayoq o'tilgan. Atseklarning poytaxti Tenochtitlan esa 1325-yilda qurilgan. Ya'ni Oksford talabalari atseklar shahridan 200 yildan ko'proq oldin o'qishgan.",
        "Kembrij esa 1209-yilda Oksforddan ketgan bir guruh olimlar tomonidan ochilgan. Ikki raqib universitet shunday tug'ilgan."],
      ["В Оксфорде преподавали уже в 1096 году, а столицу ацтеков Теночтитлан основали в 1325-м. То есть студенты Оксфорда учились более чем за 200 лет до появления этого города.",
        "А Кембридж в 1209 году основали учёные, ушедшие из Оксфорда. Так родились два университета-соперника."],
      ["Teaching took place in Oxford as early as 1096. The Aztec capital Tenochtitlan was founded in 1325. So Oxford students were studying more than 200 years before that city existed.",
        "Cambridge was started in 1209 by a group of scholars who left Oxford. That is how the two great rivals were born."]] },
    { id: "buffett", k: "story", t: ["Garvard rad etgan yigit", "Парень, которому отказал Гарвард", "The young man Harvard turned down"], p: [
      ["1950-yilda 19 yoshli Uorren Baffet Garvard biznes maktabiga hujjat topshirdi. Suhbat atigi o'n daqiqa davom etdi va unga rad javobi berildi.",
        "U juda xafa bo'ldi. Lekin keyin qiziq narsani bildi: u sevib o'qigan investitsiya kitobining muallifi Benjamin Grem Kolumbiya universitetida dars berar ekan. Baffet unga xat yozdi va Kolumbiyaga qabul qilindi.",
        "Aynan o'sha ustoz uning butun hayotini o'zgartirdi. Baffet keyinchalik dunyodagi eng muvaffaqiyatli investorlardan biriga aylandi va boyligining katta qismini xayriyaga berishga va'da qildi.",
        "Rad javobi yo'lning oxiri emas. Ba'zan u sizni haqiqiy ustozingiz kutib turgan joyga burib yuboradi. Agar bir universitet \"yo'q\" desa, chuqur nafas oling va keyingi eshikni taqillating."],
      ["В 1950 году 19-летний Уоррен Баффет подал документы в Гарвардскую школу бизнеса. Собеседование длилось десять минут, и ему отказали.",
        "Он очень расстроился. Но потом узнал, что автор его любимой книги об инвестициях Бенджамин Грэм преподаёт в Колумбийском университете. Баффет написал ему письмо и поступил в Колумбию.",
        "Именно этот учитель изменил всю его жизнь. Позже Баффет стал одним из самых успешных инвесторов мира и пообещал отдать большую часть состояния на благотворительность.",
        "Отказ это не конец пути. Иногда он ведёт туда, где вас ждёт настоящий учитель. Если один университет сказал «нет», выдохните и постучите в следующую дверь."],
      ["In 1950, 19-year-old Warren Buffett applied to Harvard Business School. The interview lasted ten minutes, and he was rejected.",
        "He was crushed. Then he found out that Benjamin Graham, the author of his favourite investing book, taught at Columbia University. Buffett wrote to him and got into Columbia.",
        "That teacher changed his whole life. Buffett went on to become one of the most successful investors in the world, and pledged most of his fortune to charity.",
        "A rejection is not the end of the road. Sometimes it turns you towards the place where your real teacher is waiting. If one university says no, take a breath and knock on the next door."]] },
    { id: "einstein", k: "story", t: ["Eynshteyn ham imtihondan yiqilgan", "Эйнштейн тоже провалил экзамен", "Einstein failed an entrance exam too"], p: [
      ["1895-yilda 16 yoshli Albert Eynshteyn Tsyurixdagi mashhur politexnika institutiga (hozirgi ETH Zurich) kirish imtihonini topshirdi. U boshqalardan ikki yosh kichik edi.",
        "Matematika va fizikadan u a'lo natija ko'rsatdi. Lekin boshqa fanlardan ball yetmadi va u qabul qilinmadi.",
        "Eynshteyn taslim bo'lmadi. Bir yil Aarau shahridagi maktabda o'qib, bilimini to'ldirdi va keyingi yili institutga qabul qilindi. Keyinchalik u fizikaga inqilob olib kirdi va Nobel mukofotini oldi.",
        "Birinchi urinishdagi natija sizning qiymatingizni belgilamaydi. Muhimi, nima yetishmaganini aniqlab, uni to'ldirish."],
      ["В 1895 году 16-летний Альберт Эйнштейн сдавал вступительный экзамен в знаменитый Политехникум Цюриха (сегодня ETH Zurich). Он был на два года младше остальных.",
        "По математике и физике он показал отличный результат, но по другим предметам баллов не хватило, и его не приняли.",
        "Эйнштейн не сдался. Год он учился в школе в Аарау, подтянул знания и на следующий год поступил. Позже он совершил переворот в физике и получил Нобелевскую премию.",
        "Результат первой попытки не определяет вашу ценность. Главное понять, чего не хватило, и восполнить это."],
      ["In 1895, 16-year-old Albert Einstein sat the entrance exam for the famous Zurich Polytechnic (today ETH Zurich). He was two years younger than the other candidates.",
        "He did brilliantly in maths and physics, but his scores in other subjects were not enough, and he was not admitted.",
        "Einstein did not give up. He spent a year at a school in Aarau, filled the gaps, and was admitted the next year. Later he changed physics forever and won the Nobel Prize.",
        "Your first attempt does not decide your worth. What matters is finding out what was missing and fixing it."]] },
    { id: "stanford-son", k: "hist", t: ["Stanford: bir o'g'il xotirasiga qurilgan universitet", "Стэнфорд: университет в память о сыне", "Stanford: a university built in memory of a son"], p: [
      ["Leland va Jeyn Stenfordlarning yagona o'g'li bor edi. 1884-yilda Yevropa safari paytida 15 yoshli Leland kichik tif kasalligidan vafot etdi.",
        "Ota-ona qayg'udan o'zini yo'qotdi. Ammo ular o'g'lining xotirasini boshqa bolalarga xizmat qilish bilan saqlashga qaror qilishdi: \"Kaliforniya bolalari bizning bolalarimiz bo'ladi\".",
        "Bir yildan keyin ular universitetga asos solishdi va 1891-yilda Stanford eshiklarini ochdi. Bugun u Silikon vodiysining yuragi: Google, Nvidia, Instagram kabi kompaniyalar asoschilari shu yerda o'qigan.",
        "Eng og'ir qayg'u ham kimdir uchun yangi imkoniyatga aylanishi mumkin. Har yili minglab yoshlar o'sha ota-onaning sevgisi tufayli orzusiga yetadi."],
      ["У Лиланда и Джейн Стэнфорд был единственный сын. В 1884 году во время поездки по Европе 15-летний Лиланд умер от брюшного тифа.",
        "Родители были убиты горем. Но решили сохранить память о сыне, служа другим детям: «Дети Калифорнии станут нашими детьми».",
        "Через год они основали университет, и в 1891 году Стэнфорд открыл двери. Сегодня это сердце Кремниевой долины: здесь учились основатели Google, Nvidia, Instagram.",
        "Даже самое тяжёлое горе может стать для кого-то новой возможностью. Каждый год тысячи молодых людей исполняют мечту благодаря любви тех родителей."],
      ["Leland and Jane Stanford had one son. In 1884, on a trip to Europe, 15-year-old Leland Jr. died of typhoid fever.",
        "His parents were heartbroken. But they decided to honour him by serving other young people: \"The children of California shall be our children.\"",
        "A year later they founded a university, and in 1891 Stanford opened its doors. Today it is the heart of Silicon Valley: the founders of Google, Nvidia and Instagram studied there.",
        "Even the deepest grief can become someone else's opportunity. Every year thousands of young people reach their dreams thanks to those parents' love."]] },
    { id: "stanford-odds", k: "res", t: ["Stanfordga kirish qanchalik qiyin?", "Насколько сложно поступить в Стэнфорд?", "How hard is it to get into Stanford?"], p: [
      ["Har 100 arizachidan taxminan 4 tasi qabul qilinadi. Ularning ko'pchiligi a'lo baholi va yuqori test natijali yoshlar.",
        "Demak, faqat yaxshi baho yetmaydi. Qabul komissiyasi \"Bu inson nimaga ishtiyoqli? Nima qildi? Atrofiga qanday ta'sir qildi?\" degan savolga javob qidiradi.",
        "Shuning uchun bitta sohada chuqur ishlang: loyiha qiling, tanlovda qatnashing, maktabingizda klub oching. Inshoingizda o'z hikoyangizni samimiy yozing.",
        "Va eslab qoling: Top 300 ichida yuzlab ajoyib universitetlar bor. UniMatch sizga mosini topishga yordam beradi."],
      ["Из каждых 100 абитуриентов принимают лишь 4-5. Большинство из них отличники с высокими баллами.",
        "Значит, одних хороших оценок мало. Приёмная комиссия ищет ответ на вопрос: «Чем этот человек горит? Что он сделал? Как повлиял на окружающих?»",
        "Поэтому глубоко занимайтесь одним направлением: делайте проекты, участвуйте в конкурсах, откройте клуб в школе. В эссе честно расскажите свою историю.",
        "И помните: в Топ-300 сотни прекрасных университетов. UniMatch поможет найти подходящий вам."],
      ["Only 4 or 5 out of every 100 applicants are admitted, and most of them have top grades and high test scores.",
        "So good grades alone are not enough. The admissions team is looking for answers to: what is this person passionate about? What have they done? How have they affected the people around them?",
        "So go deep in one area: build projects, enter competitions, start a club at school. In your essay, tell your own story honestly.",
        "And remember: the Top 300 has hundreds of wonderful universities. UniMatch helps you find the ones that fit you."]] },
    { id: "jensen", k: "story", t: ["Hojatxona tozalagan bola Nvidia'ga asos soldi", "Мальчик, мывший туалеты, основал Nvidia", "The boy who cleaned toilets founded Nvidia"], p: [
      ["Jensen Xuang 9 yoshida akasi bilan Tayvandan Amerikaga yuborildi. Qarindoshlari ularni yaxshi maktab deb o'ylab, Kentukki shtatidagi kichik maktab-internatga joylashtirishdi.",
        "Aslida bu tarbiyasi og'ir bolalar o'qiydigan maktab ekan. Kichkina Jensen har kuni hojatxonalarni tozalardi. Uning xonadoshi undan ancha katta va kuchli bola edi.",
        "Shunga qaramay u o'qishni tashlamadi. Keyin Oregon universitetida muhandislikni o'qidi, ishladi va Stanford universitetida magistr darajasini oldi.",
        "1993-yilda u ikki do'sti bilan oddiy kafeda o'tirib, yangi kompaniya rejasini tuzdi. Bu kompaniya Nvidia edi. Bugun u sun'iy intellekt inqilobining markazida va dunyodagi eng qimmat kompaniyalardan biri.",
        "Jensen keyinchalik o'sha hojatxonalarni tozalagan yillar unga mehnatni hurmat qilishni o'rgatganini aytgan. Qayerdan boshlaganingiz muhim emas. Qayerga borayotganingiz muhim."],
      ["В 9 лет Дженсена Хуанга с братом отправили из Тайваня в Америку. Родственники, думая, что это хорошая школа, устроили их в маленький интернат в Кентукки.",
        "На деле это была школа для трудных подростков. Маленький Дженсен каждый день мыл туалеты, а его сосед по комнате был намного старше и сильнее.",
        "Несмотря на это, он не бросил учёбу. Потом изучал инженерию в Университете штата Орегон, работал и получил магистра в Стэнфорде.",
        "В 1993 году он с двумя друзьями в обычном кафе набросал план новой компании. Это была Nvidia. Сегодня она в центре революции искусственного интеллекта и одна из самых дорогих компаний мира.",
        "Позже Дженсен говорил, что годы с уборкой туалетов научили его уважать любой труд. Неважно, откуда вы начинаете. Важно, куда вы идёте."],
      ["At 9, Jensen Huang and his brother were sent from Taiwan to America. Relatives, thinking it was a good school, placed them in a small boarding school in Kentucky.",
        "It turned out to be a school for troubled teenagers. Little Jensen cleaned the toilets every day, and his roommate was much older and bigger than him.",
        "Still, he never gave up on learning. He studied engineering at Oregon State University, worked, and earned a master's degree at Stanford.",
        "In 1993, sitting in an ordinary diner with two friends, he sketched a plan for a new company. It was Nvidia. Today it is at the centre of the AI revolution and one of the most valuable companies in the world.",
        "Jensen later said that those years of cleaning toilets taught him to respect every kind of work. Where you start does not matter. Where you are going does."]] },
    { id: "malala", k: "story", t: ["Malala: o'qiyman degani uchun o'q uzilgan qiz Oksfordda", "Малала: девушка, в которую стреляли за учёбу, в Оксфорде", "Malala: shot for wanting to learn, then Oxford"], p: [
      ["Malala Yusufzay Pokistonning Svat vodiysida o'sgan. U yerda qizlarning maktabga borishi taqiqlana boshlaganda, 11 yoshli Malala buning noto'g'ri ekanini ochiq aytdi.",
        "2012-yilda, 15 yoshida, maktab avtobusida unga o'q uzildi. U og'ir yaralandi, lekin omon qoldi va sog'ayib, kurashni davom ettirdi.",
        "17 yoshida u Nobel tinchlik mukofotini oldi: tarixdagi eng yosh laureat. Keyin Oksford universitetida falsafa, siyosat va iqtisodni o'qib, 2020-yilda bitirdi.",
        "Malala aytgan: \"Bitta bola, bitta o'qituvchi, bitta kitob va bitta qalam dunyoni o'zgartira oladi\". Sizning qo'lingizdagi qalam ham shunday kuchga ega."],
      ["Малала Юсуфзай выросла в долине Сват в Пакистане. Когда там стали запрещать девочкам ходить в школу, 11-летняя Малала открыто сказала, что это неправильно.",
        "В 2012 году, в 15 лет, в неё выстрелили в школьном автобусе. Она была тяжело ранена, но выжила, поправилась и продолжила борьбу.",
        "В 17 лет она получила Нобелевскую премию мира, став самым молодым лауреатом в истории. Затем изучала философию, политику и экономику в Оксфорде и окончила его в 2020 году.",
        "Малала говорит: «Один ребёнок, один учитель, одна книга и одна ручка могут изменить мир». Ручка в ваших руках тоже обладает этой силой."],
      ["Malala Yousafzai grew up in the Swat Valley in Pakistan. When girls there began to be banned from school, 11-year-old Malala spoke out that it was wrong.",
        "In 2012, at 15, she was shot on her school bus. She was badly hurt, but she survived, recovered and kept going.",
        "At 17 she received the Nobel Peace Prize, the youngest winner in history. She then studied philosophy, politics and economics at Oxford and graduated in 2020.",
        "Malala says: \"One child, one teacher, one book, one pen can change the world.\" The pen in your hand has that power too."]] },
    { id: "mit-ocw", k: "fact", t: ["MIT darslari hamma uchun bepul", "Курсы MIT бесплатны для всех", "MIT's courses are free for everyone"], p: [
      ["2001-yilda MIT o'z kurslarining materiallarini internetga bepul joylashtirishga qaror qildi. Bugun ocw.mit.edu saytida 2 500 dan ortiq kurs bor: ma'ruzalar, vazifalar, imtihonlar.",
        "Ya'ni siz hozirning o'zida, Urganchda turib, MIT talabalari o'qiyotgan fizika yoki dasturlash kursini boshlashingiz mumkin. Bunday kurs inshoingizda ham kuchli dalil bo'ladi."],
      ["В 2001 году MIT решил бесплатно выложить материалы своих курсов в интернет. Сегодня на сайте ocw.mit.edu более 2 500 курсов: лекции, задания, экзамены.",
        "То есть уже сейчас, прямо из Ургенча, вы можете начать тот же курс физики или программирования, что и студенты MIT. Такой курс станет сильным аргументом и в эссе."],
      ["In 2001 MIT decided to put its course materials online for free. Today ocw.mit.edu has more than 2,500 courses: lectures, assignments and exams.",
        "So right now, from Urgench, you can start the same physics or programming course MIT students take. A course like that is also strong evidence in your essay."]] },
    { id: "newton", k: "fact", t: ["Nyuton eng buyuk kashfiyotlarini karantinda qilgan", "Ньютон сделал главные открытия на карантине", "Newton made his greatest discoveries in quarantine"], p: [
      ["1665-yilda Angliyada vabo tarqalib, Kembrij universiteti yopildi. 22 yoshli talaba Isaak Nyuton uyiga qaytdi.",
        "Ikki yil davomida u yolg'iz o'zi o'qib, matematik tahlil asoslarini, yorug'lik haqidagi g'oyalarini va butun olam tortishish qonuniga olib boradigan fikrlarini ishlab chiqdi. Bu yillar \"mo''jizalar yili\" deb ataladi.",
        "Ta'til, karantin yoki bo'sh vaqt ham katta ishlar boshlanadigan payt bo'lishi mumkin. " + SEASON[0]],
      ["В 1665 году в Англии началась чума, и Кембриджский университет закрыли. 22-летний студент Исаак Ньютон вернулся домой.",
        "За два года в одиночку он заложил основы математического анализа, идеи о свете и мысли, приведшие к закону всемирного тяготения. Эти годы называют «годом чудес».",
        "Каникулы, карантин или свободное время тоже могут стать началом большого дела. " + SEASON[1]],
      ["In 1665 plague spread across England and Cambridge University closed. A 22-year-old student, Isaac Newton, went home.",
        "Over two years, working alone, he laid the foundations of calculus, his ideas about light, and the thinking that led to the law of universal gravitation. These are called his \"miracle years\".",
        "A holiday, a lockdown or free time can be when great work begins. " + SEASON[2]]] },
    { id: "what-they-see", k: "tip", t: ["Qabul komissiyasi aslida nimaga qaraydi?", "На что на самом деле смотрит приёмная комиссия?", "What do admissions officers really look at?"], p: [
      ["Top universitetlar arizangizni \"butunligicha\" ko'radi. Odatda beshta narsa muhim:",
        "1. Baholaringiz va ular qanday o'sgani. 2. Test natijalari: IELTS, SAT. 3. Faoliyatlaringiz: ko'p narsa emas, bir-ikki sohada chuqur natija. 4. Insholar: sizning ovozingiz va qadriyatlaringiz. 5. Tavsiyanomalar: o'qituvchilaringiz sizni qanday ko'radi.",
        "Eng ko'p uchraydigan xato: hamma narsaga ozgina qatnashish. Komissiya \"hamma narsani qiladigan\" emas, \"bir narsani juda yaxshi qiladigan\" yoshni eslab qoladi.",
        "Application Studio'da shu beshta qismni bosqichma-bosqich tayyorlashingiz mumkin."],
      ["Топ-университеты оценивают заявку целиком. Обычно важны пять вещей:",
        "1. Оценки и их рост. 2. Результаты тестов: IELTS, SAT. 3. Активности: не много, а глубокий результат в одной-двух областях. 4. Эссе: ваш голос и ценности. 5. Рекомендации: каким вас видят учителя.",
        "Самая частая ошибка: понемногу участвовать во всём. Комиссия запоминает не того, кто «делает всё», а того, кто «делает одно очень хорошо».",
        "В Application Studio можно шаг за шагом подготовить все пять частей."],
      ["Top universities read your application as a whole. Usually five things matter:",
        "1. Your grades and how they grew. 2. Test scores: IELTS, SAT. 3. Activities: not many, but deep results in one or two areas. 4. Essays: your voice and values. 5. Recommendations: how your teachers see you.",
        "The most common mistake is doing a little of everything. Admissions officers remember the student who does one thing really well, not the one who does everything.",
        "In Application Studio you can prepare all five parts step by step."]] },
    { id: "alxorazmiy", k: "hist", t: ["\"Algoritm\" so'zi Xorazmdan chiqqan", "Слово «алгоритм» родом из Хорезма", "The word \"algorithm\" comes from Khorezm"], p: [
      ["IX asrda Xorazmda tug'ilgan olim Muhammad ibn Muso al-Xorazmiy Bag'doddagi \"Bayt ul-Hikma\" (Donishmandlar uyi) ilmiy markazida ishlagan.",
        "Uning \"al-Jabr va al-muqobala\" kitobi nomidan \"algebra\" so'zi kelib chiqqan. Kitoblari lotin tiliga tarjima qilinganda ismi \"Algoritmi\" deb yozilgan va bugungi \"algoritm\" so'zi shundan.",
        "Bugun dunyodagi har bir dastur, har bir sun'iy intellekt algoritm asosida ishlaydi. MIT, Stanford va Kembrijda o'qitiladigan informatika ham sizning yurtdoshingiz nomi bilan boshlanadi.",
        "Siz ham al-Xorazmiy tug'ilgan zamindansiz. Dunyo ilmiga hissa qo'shish sizga ham begona emas."],
      ["В IX веке уроженец Хорезма Мухаммад ибн Муса аль-Хорезми работал в багдадском научном центре «Дом мудрости».",
        "От названия его книги «аль-Джабр валь-мукабала» произошло слово «алгебра». В латинских переводах его имя писали как «Algoritmi», и отсюда наше слово «алгоритм».",
        "Сегодня каждая программа и каждый искусственный интеллект работают на алгоритмах. Информатика, которую изучают в MIT, Стэнфорде и Кембридже, начинается с имени вашего земляка.",
        "Вы родом с той же земли, что и аль-Хорезми. Вклад в мировую науку и для вас не чужое дело."],
      ["In the 9th century Muhammad ibn Musa al-Khwarizmi, born in Khorezm, worked at Baghdad's House of Wisdom.",
        "The word \"algebra\" comes from the title of his book, al-Jabr wal-Muqabala. In Latin translations his name was written \"Algoritmi\", which gave us the word \"algorithm\".",
        "Today every program and every AI runs on algorithms. The computer science taught at MIT, Stanford and Cambridge begins with the name of someone from your own region.",
        "You come from the same land as al-Khwarizmi. Contributing to world science is not out of reach for you either."]] },
    { id: "beruniy", k: "fact", t: ["Beruniy Yer radiusini ming yil oldin o'lchagan", "Бируни измерил радиус Земли тысячу лет назад", "Biruni measured the Earth's radius a thousand years ago"], p: [
      ["973-yilda Xorazmning Kat shahrida tug'ilgan Abu Rayhon Beruniy XI asr boshida tog' cho'qqisidan ufqni kuzatib, Yerning radiusini hisoblab chiqdi.",
        "U topgan natija taxminan 6 340 kilometr. Bugungi aniq o'lchov esa taxminan 6 371 kilometr. Farq bir foizga ham yetmaydi, va bu sun'iy yo'ldoshlarsiz, faqat geometriya bilan!",
        "Beruniy astronomiya, geografiya, matematika va tarixga oid 100 dan ortiq asar yozgan. Bugun uning nomi Oydagi kraterga ham berilgan.",
        "Katta kashfiyot uchun qimmat jihozlar emas, aniq savol va sabr kerak. Siz qaysi savolga javob qidirasiz?"],
      ["Абу Рейхан Бируни, родившийся в 973 году в хорезмском городе Кят, в начале XI века, наблюдая горизонт с вершины горы, вычислил радиус Земли.",
        "Его результат около 6 340 километров. Современное значение около 6 371 километра. Разница меньше одного процента, и это без спутников, только с геометрией!",
        "Бируни написал более 100 трудов по астрономии, географии, математике и истории. Сегодня его именем назван даже кратер на Луне.",
        "Для большого открытия нужны не дорогие приборы, а точный вопрос и терпение. На какой вопрос ищете ответ вы?"],
      ["Abu Rayhan al-Biruni, born in 973 in Kath in Khorezm, measured the horizon from a mountain top in the early 11th century and calculated the Earth's radius.",
        "His result was about 6,340 kilometres. Today's value is about 6,371 kilometres. That is less than one percent off, with no satellites, only geometry!",
        "Biruni wrote over 100 works on astronomy, geography, mathematics and history. A crater on the Moon carries his name today.",
        "A great discovery needs a precise question and patience more than expensive tools. What question are you looking to answer?"]] },
    { id: "ibnsino", k: "hist", t: ["Ibn Sinoning kitobi Yevropada 500 yil darslik bo'lgan", "Книга Ибн Сины 500 лет была учебником в Европе", "Avicenna's book was a textbook in Europe for 500 years"], p: [
      ["Buxoro yaqinidagi Afshona qishlog'ida tug'ilgan Abu Ali ibn Sino 18 yoshida shifokor sifatida tanilgan edi.",
        "U yozgan \"Tib qonunlari\" kitobi XII asrda lotin tiliga tarjima qilindi va Yevropa universitetlarida, jumladan Italiya va Fransiyada, XVII asrgacha asosiy tibbiyot darsligi bo'lib keldi.",
        "Ya'ni besh asr davomida Yevropaning bo'lajak shifokorlari Buxorolik olimning kitobidan o'qigan.",
        "Bilim chegara bilmaydi. Bugun siz o'qiyotgan har bir kitob ham sizni dunyoning istalgan universitetiga olib borishi mumkin."],
      ["Абу Али ибн Сина, родившийся в селе Афшана под Бухарой, уже в 18 лет был известным врачом.",
        "Его «Канон врачебной науки» в XII веке перевели на латынь, и до XVII века он оставался главным учебником медицины в университетах Европы, в том числе в Италии и Франции.",
        "То есть пять веков будущие врачи Европы учились по книге учёного из Бухары.",
        "Знание не знает границ. Каждая книга, которую вы читаете сегодня, может привести вас в любой университет мира."],
      ["Abu Ali ibn Sina (Avicenna), born in the village of Afshana near Bukhara, was a known physician by the age of 18.",
        "His Canon of Medicine was translated into Latin in the 12th century and remained a main medical textbook at European universities, including in Italy and France, until the 17th century.",
        "For five centuries, Europe's future doctors studied from the book of a scholar from Bukhara.",
        "Knowledge has no borders. Every book you read today can take you to any university in the world."]] },
    { id: "ulugbek", k: "hist", t: ["Ulug'bek madrasasi Oksford kollejlari bilan tengdosh", "Медресе Улугбека ровесник колледжей Оксфорда", "Ulugh Beg's madrasa is as old as Oxford colleges"], p: [
      ["Samarqanddagi Ulug'bek madrasasi 1417-1420-yillarda qurilgan. Xuddi shu davrda Oksfordda ham yangi kollejlar ochilayotgan edi.",
        "Ulug'bek u yerda faqat diniy fanlarni emas, astronomiya va matematikani ham o'qitgan. Uning rasadxonasida tuzilgan yulduzlar jadvalida mingdan ortiq yulduzning o'rni yozilgan va u asrlar davomida eng aniq jadvallardan biri hisoblangan.",
        "Samarqand o'sha paytda dunyo ilmining markazlaridan biri edi. Ilm yo'li sizning yurtingizda ham boshlangan.",
        "Bugun siz Oksford yoki Garvardga hujjat topshirsangiz, ajdodlaringiz boshlagan yo'lni davom ettirgan bo'lasiz."],
      ["Медресе Улугбека в Самарканде построено в 1417-1420 годах. В то же время в Оксфорде открывались новые колледжи.",
        "Улугбек преподавал там не только богословие, но и астрономию и математику. В звёздном каталоге его обсерватории записаны положения более тысячи звёзд, и веками он считался одним из самых точных.",
        "Самарканд тогда был одним из центров мировой науки. Путь знаний начинался и на вашей земле.",
        "Подавая документы в Оксфорд или Гарвард, вы продолжаете путь, который начали ваши предки."],
      ["Ulugh Beg's madrasa in Samarkand was built in 1417-1420, at the same time as new colleges were opening in Oxford.",
        "Ulugh Beg taught there not only religion but astronomy and mathematics. His observatory's star catalogue recorded the positions of over a thousand stars and was among the most accurate for centuries.",
        "Samarkand was then one of the centres of world science. The road of learning began in your land too.",
        "When you apply to Oxford or Harvard today, you continue the road your ancestors started."]] },
    { id: "needblind", k: "tip", t: ["Ba'zi top universitetlar xalqaro talabaga ham to'liq grant beradi", "Некоторые топ-вузы дают полный грант и иностранцам", "Some top universities fully fund international students"], p: [
      ["Harvard, Yale, Princeton, MIT, Dartmouth va Amherst xalqaro talabalarni ham \"need-blind\" tarzda qabul qiladi: qaror qabul qilishda oilangiz to'lay olishi yoki yo'qligiga qaralmaydi.",
        "Qabul qilinsangiz, ular oilangizning daromadiga qarab kerakli mablag'ning 100 foizini qoplaydi. Ko'p o'zbek talabalari shu tarzda deyarli bepul o'qiydi.",
        "Boshqa ko'p universitetlar esa xalqaro talaba uchun \"need-aware\": grant so'rash qabul imkoniyatiga ta'sir qilishi mumkin. Shuning uchun ro'yxatingizda ikkala turdagi universitetlar bo'lsin.",
        "Har bir universitetning \"Financial aid for international students\" sahifasini o'qing va CSS Profile hujjatini vaqtida topshiring."],
      ["Harvard, Yale, Princeton, MIT, Dartmouth и Amherst принимают и иностранцев по принципу «need-blind»: при решении не смотрят, может ли семья платить.",
        "Если вас примут, они покрывают 100 процентов нужной суммы по доходу семьи. Многие студенты из Узбекистана учатся так почти бесплатно.",
        "Многие другие вузы для иностранцев «need-aware»: запрос гранта может влиять на шансы. Поэтому включайте в список университеты обоих типов.",
        "Читайте страницу «Financial aid for international students» каждого вуза и вовремя подавайте CSS Profile."],
      ["Harvard, Yale, Princeton, MIT, Dartmouth and Amherst admit international students \"need-blind\": whether your family can pay plays no part in the decision.",
        "If you are admitted, they cover 100 percent of your demonstrated need based on family income. Many students from Uzbekistan study almost free this way.",
        "Many other universities are \"need-aware\" for international students: asking for aid can affect your chances. So put both kinds on your list.",
        "Read each university's \"Financial aid for international students\" page and submit the CSS Profile on time."]] },
    { id: "free-tuition", k: "res", t: ["Harvard va MIT: kam daromadli oilalar uchun bepul", "Гарвард и MIT: бесплатно для семей с небольшим доходом", "Harvard and MIT: free for lower-income families"], p: [
      ["2025-yildan Harvardda yillik daromadi 100 000 dollargacha bo'lgan oila farzandi uchun o'qish, yotoqxona, ovqat va sug'urta bepul. Daromadi 200 000 dollargacha bo'lsa, o'qish to'lovi olinmaydi.",
        "MIT ham 2025-yil kuzidan shunday qildi: 200 000 dollardan kam daromadli oilalar o'qish uchun to'lamaydi, 100 000 dollardan kam bo'lsa, umuman hech narsa to'lamaydi.",
        "O'zbekistondagi oilalarning deyarli hammasi bu chegaradan pastda. Ya'ni qabul qilinsangiz, pul to'siq bo'lmaydi.",
        "Eng katta to'siq pul emas, tayyorgarlik. Bugundan boshlang."],
      ["С 2025 года в Гарварде для семей с годовым доходом до 100 000 долларов учёба, общежитие, питание и страховка бесплатны. При доходе до 200 000 долларов не берут плату за обучение.",
        "MIT с осени 2025 года сделал так же: семьи с доходом меньше 200 000 долларов не платят за обучение, а меньше 100 000 не платят ничего.",
        "Почти все семьи в Узбекистане ниже этой границы. То есть если вас примут, деньги не станут препятствием.",
        "Главное препятствие не деньги, а подготовка. Начните сегодня."],
      ["From 2025, Harvard covers tuition, housing, food and health insurance for students from families earning up to $100,000 a year, and charges no tuition up to $200,000.",
        "MIT did the same from fall 2025: families earning under $200,000 pay no tuition, and under $100,000 pay nothing at all.",
        "Almost every family in Uzbekistan is below that line. If you are admitted, money will not be the barrier.",
        "The biggest barrier is not money but preparation. Start today."]] },
    { id: "bodleian", k: "fact", t: ["Oksford kutubxonasi Britaniyada chiqqan har bir kitobni oladi", "Библиотека Оксфорда получает каждую книгу Британии", "Oxford's library gets every book published in Britain"], p: [
      ["1610-yildan beri Oksforddagi Bodli kutubxonasi Britaniyada nashr etilgan har bir kitobning bir nusxasini olish huquqiga ega.",
        "Bugun unda 13 milliondan ortiq bosma asar saqlanadi. Qadimgi qo'lyozmalar, xaritalar va Tolkinning qo'lyozmalari ham shu yerda.",
        "Oksford talabalari bu xazinadan bemalol foydalanadi. Siz esa hozir ham internet orqali dunyoning eng yaxshi kutubxonalari va kurslaridan foydalana olasiz."],
      ["С 1610 года Бодлианская библиотека Оксфорда имеет право получать экземпляр каждой книги, изданной в Британии.",
        "Сегодня в ней более 13 миллионов печатных изданий. Здесь хранятся древние рукописи, карты и рукописи Толкина.",
        "Студенты Оксфорда свободно пользуются этим сокровищем. А вы уже сейчас можете через интернет пользоваться лучшими библиотеками и курсами мира."],
      ["Since 1610 Oxford's Bodleian Library has had the right to a copy of every book published in Britain.",
        "Today it holds over 13 million printed items, along with ancient manuscripts, maps and Tolkien's papers.",
        "Oxford students use this treasure freely. And you can already use the world's best libraries and courses online."]] },
    { id: "commonapp", k: "tip", t: ["Bitta ariza bilan 1 000 dan ortiq universitetga", "Одна заявка, более 1 000 университетов", "One application, over 1,000 universities"], p: [
      ["Common App orqali AQSh va boshqa davlatlardagi 1 000 dan ortiq universitetga bitta umumiy ariza bilan topshirish mumkin. Bir mavsumda 20 tagacha universitet tanlanadi.",
        "Shaxsiy ma'lumotlar, baholar, faoliyatlar va asosiy insho bir marta yoziladi. Har bir universitet faqat o'z qo'shimcha savollarini so'raydi.",
        "Xalqaro talabalar uchun ro'yxatdan o'tish bepul, ko'p universitetlar esa ariza to'lovidan ozod qilishni (fee waiver) ham beradi.",
        "Application Studio'da shu ma'lumotlarni oldindan tayyorlab, keyin Common App'ga nusxa ko'chirishingiz mumkin."],
      ["Через Common App можно одной общей заявкой подать документы в более чем 1 000 университетов США и других стран. За сезон выбирают до 20 университетов.",
        "Личные данные, оценки, активности и основное эссе пишутся один раз. Каждый вуз спрашивает только свои дополнительные вопросы.",
        "Регистрация бесплатна, а многие вузы освобождают от сбора за заявку (fee waiver).",
        "В Application Studio можно заранее подготовить эти данные и потом скопировать их в Common App."],
      ["With the Common App you can apply to over 1,000 universities in the US and other countries with one shared application, choosing up to 20 per season.",
        "Personal details, grades, activities and the main essay are written once. Each university asks only its own extra questions.",
        "Creating an account is free, and many universities also offer an application fee waiver.",
        "You can prepare all of this in Application Studio first, then copy it into the Common App."]] },
  ];
  // photos: Wikimedia Commons (free licences); each story shows its author and licence under the picture
  const PHOTO = {"harvard400": ["Jessica Williams", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:John_Harvard_statue_at_Harvard_University.jpg"], "qarawiyyin": ["Khonsali", "Public domain", "https://commons.wikimedia.org/wiki/File:Al-Qarawiyyin_University%2C_Fes%2C_Morocco_-_Var_132.jpg"], "oxford-aztec": ["Julian Herzog", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Radcliffe_Camera_Oxford_2018_03.jpg"], "buffett": ["King of Hearts", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Columbia_University_New_York_November_2016_002.jpg"], "stanford-son": ["King of Hearts", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Stanford_Memorial_Church_October_2019_HDR.jpg"], "stanford-odds": ["King of Hearts", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Stanford_University_from_Hoover_Tower_May_2011_001.jpg"], "jensen": ["Owen", "Public domain", "https://commons.wikimedia.org/wiki/File:Memorial_Union_at_Oregon_State_University.jpg"], "malala": ["Ed Webster", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Lady_Margaret_Hall_%286148510434%29.jpg"], "mit-ocw": ["Peacearth", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Great_dome_of_MIT%2C_Feb_2021.jpg"], "newton": ["Rafa Esteve", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Trinity_College_-_Great_Court_01.jpg"], "what-they-see": ["Atilin", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Harvard_Yard_North_Chapel.jpg"], "einstein": ["Roland zh", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:ETH_Z%C3%BCrich_Hauptgeb%C3%A4ude%2C_Ansicht_von_der_Polyterrasse_2011-08-06_ShiftN.jpg"]};
  const txt = (a) => a[L] || a[0];
  const mins = (s) => Math.max(1, Math.round(txt(s.p).join(" ").split(/\s+/).length / 180));
  const kind = (s) => K[s.k][L];
  const seenSet = () => new Set(store.get("stories_seen", []));
  const unread = () => { const s = seenSet(); return ALL.filter((x) => !s.has(x.id)).length; };
  let timer = null, pausedTill = 0;

  function ribbon() {
    setTimeout(bind, 0);
    const n = unread(), s = seenSet();
    return `<div id="nw" class="nw sto">
      <button class="nw-head" onclick="storyList()"><b>${T("Universitetlar haqida qiziqarli ma'lumotlar")}</b>${n ? `<em>${n}</em>` : ""}<span>${T("Barchasi")} ${ic("chev")}</span></button>
      <div class="nw-track" id="nw-track">${ALL.map((x, i) => `<button class="nw-card ${s.has(x.id) ? "" : "new"}" onclick="storyOpen(${i})">
        ${PHOTO[x.id] ? `<span class="nw-img sto-ph"><img src="img/stories/${x.id}.webp" alt="" loading="lazy" decoding="async"><i class="k-${x.k}">${ic(K[x.k][3])}</i></span>` : `<span class="nw-img sto-ic k-${x.k}">${ic(K[x.k][3])}</span>`}<span class="nw-txt"><b>${esc(txt(x.t))}</b><small>${kind(x)} · ${T("{n} daqiqa", { n: mins(x) })}</small></span></button>`).join("")}</div>
      <div class="nw-dots">${ALL.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div></div>`;
  }
  function bind() {
    clearInterval(timer);
    const tr = document.getElementById("nw-track"); if (!tr) return;
    const dots = [...document.querySelectorAll(".nw-dots i")], idx = () => Math.round(tr.scrollLeft / tr.clientWidth);
    tr.addEventListener("scroll", () => { const k = idx(); dots.forEach((d, i) => d.classList.toggle("on", i === k)); }, { passive: true });
    ["touchstart", "pointerdown", "wheel"].forEach((ev) => tr.addEventListener(ev, () => { pausedTill = Date.now() + 8000; }, { passive: true }));
    timer = setInterval(() => {
      if (!document.body.contains(tr)) return clearInterval(timer);
      if (Date.now() < pausedTill || document.hidden) return;
      tr.scrollTo({ left: ((idx() + 1) % tr.children.length) * tr.clientWidth, behavior: "smooth" });
    }, 6000);
  }
  window.storyOpen = (i, from) => {
    const x = ALL[i]; if (!x) return; haptic("light");
    const s = seenSet(); s.add(x.id); store.set("stories_seen", [...s]); paint();
    const next = ALL[(i + 1) % ALL.length];
    const ph = PHOTO[x.id];
    sheet(`<div class="nw-read sto-read">${ph ? `<figure class="sto-hero"><img src="img/stories/${x.id}.webp" alt=""><figcaption>${T("Rasm")}: ${esc(ph[0])}, ${esc(ph[1])}, <a href="#" onclick="openExt('${encodeURIComponent(ph[2])}');return false">Wikimedia Commons</a></figcaption></figure>` : ""}<span class="sto-badge k-${x.k}">${ic(K[x.k][3])} ${kind(x)} · ${T("{n} daqiqa", { n: mins(x) })}</span>
      <h3>${esc(txt(x.t))}</h3>${txt(x.p).map((p) => `<p>${esc(p)}</p>`).join("")}
      <button class="btn-primary" onclick="storyOpen(${(i + 1) % ALL.length})">${T("Keyingisi")}: ${esc(txt(next.t))}</button>
      <button class="btn-ghost" onclick="shareStory(${i})">${ic("send")} ${T("Do'stga ulashish")}</button></div>`);
  };
  window.shareStory = (i) => { const x = ALL[i]; haptic("light"); openTg(`https://t.me/share/url?url=${encodeURIComponent("https://t.me/" + BOT)}&text=${encodeURIComponent(txt(x.t) + "\n\n" + txt(x.p)[0])}`); };
  window.storyList = () => {
    haptic("light"); const s = seenSet();
    sheet(`<h3>${T("Universitetlar haqida qiziqarli ma'lumotlar")}</h3><div class="nw-list">${ALL.map((x, i) => `<button class="nw-row ${s.has(x.id) ? "" : "new"}" onclick="storyOpen(${i},'list')"><b>${esc(txt(x.t))}</b><small>${kind(x)} · ${T("{n} daqiqa", { n: mins(x) })}</small></button>`).join("")}</div>`);
  };
  function paint() {
    const n = unread();
    document.querySelectorAll("[data-nb]").forEach((el) => { el.textContent = n > 9 ? "9+" : n || ""; el.classList.toggle("on", n > 0); });
    const em = document.querySelector(".nw-head em"); if (em) { if (n) em.textContent = n; else em.remove(); }
  }
  const app = document.getElementById("app");
  if (app) new MutationObserver(paint).observe(app, { childList: true });
  return { ribbon, paint };
})();
window.Stories = Stories;
