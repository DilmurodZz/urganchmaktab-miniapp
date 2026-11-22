// "Insho va tavsiyanoma maslahatlari": the advice admissions officers and students admitted to top universities give most often,
// for the Common App personal essay, the supplements, the activities list and recommendation letters, plus a word on AI.
// Each tip is [title, text] in uz, ru and en; the page shows the app's language (ru and en as written, everything else in uz).
window.Tips = (() => {
  const L = () => (LANG === "ru" || LANG === "en" ? LANG : "uz");
  const S = [
    { id: "ai", ic: "alert", h: { uz: "Sun'iy intellekt va insho", ru: "Искусственный интеллект и эссе", en: "AI and your essay" }, hot: true, items: [
      { uz: ["Sun'iy intellekt o'rtacha yozadi", "Sun'iy intellekt matnni ehtimollik bilan yozadi: kontekstga qarab eng ko'p uchraydigan keyingi so'zni tanlaydi. Shuning uchun u sizga eng o'rtacha, eng ko'p takrorlangan fikrni beradi, o'ta noyob yoki hayratlanarli g'oyani bermaydi. Komissiya esa minglab bir xil insholar orasidan aynan sizni qidiradi."],
        ru: ["ИИ пишет «среднее»", "Искусственный интеллект пишет по вероятности: по контексту выбирает самое частое следующее слово. Поэтому он даёт самую среднюю, самую повторяемую мысль, а не по-настоящему уникальную или впечатляющую идею. А приёмная комиссия среди тысяч похожих эссе ищет именно вас."],
        en: ["AI writes the average", "AI writes by probability: from the context it picks the most likely next word. So it gives you the most average, most repeated idea, never a truly unique or striking one. Admissions officers are looking for you among thousands of similar essays."] },
      { uz: ["G'oyani o'zingiz toping, 2-3 oy yozing", "Ta'sirli insho bir kechada yoki bir-ikki kunda yozilmaydi. G'oyani o'zingiz toping, so'ng 2-3 oy davomida bir necha qoralama yozing, dam bering va qayta yozing. Common App qoidalariga ko'ra, sun'iy intellekt yozib bergan matnni o'zingizniki qilib topshirish firibgarlik hisoblanadi."],
        ru: ["Найдите идею сами и пишите 2-3 месяца", "Сильное эссе не пишется за одну ночь или пару дней. Найдите идею сами, затем 2-3 месяца пишите черновики, давайте им отлежаться и переписывайте. По правилам Common App выдавать текст, написанный ИИ, за свой считается мошенничеством."],
        en: ["Find the idea yourself, write for 2-3 months", "A striking essay is not written in one night or a couple of days. Find the idea yourself, then spend 2-3 months writing drafts, letting them rest and rewriting. Under Common App rules, submitting AI-written content as your own counts as fraud."] },
    ] },
    { id: "pe", ic: "pen", h: { uz: "Common App shaxsiy inshosi (650 so'z)", ru: "Личное эссе Common App (650 слов)", en: "Common App personal essay (650 words)" }, items: [
      { uz: ["Bitta aniq voqeani tanlang", "Kuchli insholar ko'pincha butun hayot haqida emas, bitta kichik lahza haqida: oshxonadagi suhbat, buzilgan velosiped, bobongiz bilan bahs. Yutuqlar ro'yxati kerak emas, ular arizaning boshqa qismida bor."],
        ru: ["Выберите один конкретный момент", "Сильные эссе обычно не о всей жизни, а об одном небольшом моменте: разговор на кухне, сломанный велосипед, спор с дедушкой. Список достижений не нужен, он есть в другой части заявки."],
        en: ["Pick one specific moment", "Strong essays are rarely about your whole life. They are about one small moment: a talk in the kitchen, a broken bicycle, an argument with your grandfather. Skip the list of achievements; it is elsewhere in the application."] },
      { uz: ["Ko'rsating, aytmang", "\"Men qat'iyatliman\" deb yozmang. Qat'iyatingiz o'zi ko'rinib turadigan voqeani yozing: nima qildingiz, nima dedingiz, nimani his qildingiz."],
        ru: ["Показывайте, а не рассказывайте", "Не пишите «я настойчивый». Опишите случай, где настойчивость видна сама: что вы сделали, что сказали, что почувствовали."],
        en: ["Show, don't tell", "Don't write \"I am determined.\" Write the moment where it shows on its own: what you did, what you said, what you felt."] },
      { uz: ["Fikringiz voqeadan muhimroq", "Qabul komissiyasi xodimlari ko'p takrorlaydi: voqeaning o'zi emas, siz undan nimani tushunganingiz muhim. Inshoning taxminan yarmi sizning fikrlashingiz, o'zgarishingiz va xulosangiz bo'lsin."],
        ru: ["Ваши мысли важнее события", "Сотрудники приёмных комиссий часто повторяют: важно не само событие, а то, что вы из него поняли. Примерно половина эссе должна быть о вашем мышлении, изменении и выводах."],
        en: ["Your reflection matters more than the story", "Admissions officers say it again and again: what matters is not the event but what you understood from it. Let about half of the essay be your thinking, how you changed and what you concluded."] },
      { uz: ["\"Faqat siz yoza oladigan\" insho", "Tekshiring: ismingizni olib tashlasa, boshqa talaba ham shu inshoni yoza oladimi? Agar ha bo'lsa, qayta yozing. Sport jarohati yoki bir haftalik ko'ngillilik kabi ko'p takrorlanadigan mavzularni faqat o'zgacha nuqtai nazar bilan oling."],
        ru: ["Эссе, которое можете написать только вы", "Проверьте: если убрать ваше имя, мог бы это эссе написать другой ученик? Если да, перепишите. Частые темы вроде спортивной травмы или недели волонтёрства берите только с необычным взглядом."],
        en: ["An essay only you could write", "Test it: if your name were removed, could another student have written it? If yes, rewrite it. Take common topics like a sports injury or a one-week volunteer trip only with an unusual angle."] },
      { uz: ["Ovozingiz eshitilsin", "Inshoni ovoz chiqarib o'qing: u siz gapirgandek eshitilsinmi? \"Oshxona stoli\" sinovi: inshoni o'qigan kishi siz bilan bir stolda suhbatlashgandek bo'lsin. Murakkab so'zlar emas, aniq va jonli til kerak."],
        ru: ["Пусть звучит ваш голос", "Прочитайте эссе вслух: звучит ли оно как вы? Тест «кухонного стола»: читатель должен почувствовать, будто поговорил с вами за одним столом. Нужны не сложные слова, а ясный живой язык."],
        en: ["Let your voice come through", "Read it aloud: does it sound like you? The \"kitchen table\" test: the reader should feel they just talked with you across a table. You need clear, living language, not big words."] },
      { uz: ["Birinchi jumla", "Voqeaning o'rtasidan boshlang. Mashhur odamlar iqtiboslari, lug'atdagi ta'riflar va \"Bolaligimdan beri...\" kabi boshlanishlardan qoching."],
        ru: ["Первое предложение", "Начните с середины события. Избегайте цитат знаменитостей, словарных определений и начал вроде «С детства я...»."],
        en: ["The first sentence", "Start in the middle of the action. Avoid famous quotes, dictionary definitions and openings like \"Ever since I was a child...\"."] },
      { uz: ["Ko'p qoralama, kam o'quvchi", "Qabul qilinganlar odatda 5-10 ta qoralama yozgan. Har qoralamadan keyin bir hafta dam bering. Inshoni sizni yaxshi biladigan 1-2 kishiga ko'rsating, o'n kishiga emas: aks holda ovozingiz yo'qoladi."],
        ru: ["Много черновиков, мало читателей", "Поступившие обычно писали 5-10 черновиков. После каждого дайте тексту неделю отдохнуть. Показывайте эссе 1-2 людям, которые хорошо вас знают, а не десяти: иначе пропадёт ваш голос."],
        en: ["Many drafts, few readers", "Admitted students usually wrote 5-10 drafts. Let each one rest for a week. Show it to 1-2 people who know you well, not ten, or your voice gets lost."] },
    ] },
    { id: "sup", ic: "file", h: { uz: "Qo'shimcha insholar va faoliyatlar ro'yxati", ru: "Дополнительные эссе и список активностей", en: "Supplements and the activities list" }, items: [
      { uz: ["\"Nega aynan biz?\"", "Aniq dasturlar, kurslar, professorlar, klublarni nomi bilan yozing va ularni o'zingiz bilan bog'lang. Boshqa universitet nomini qo'ysa ham ishlaydigan insho zaif hisoblanadi."],
        ru: ["«Почему именно мы?»", "Называйте конкретные программы, курсы, профессоров, клубы и связывайте их с собой. Эссе, которое подходит и для другого университета, считается слабым."],
        en: ["\"Why us?\"", "Name specific programs, courses, professors and clubs, and connect them to yourself. An essay that still works with another university's name in it is weak."] },
      { uz: ["Qisqa javoblar ham muhim", "50-150 so'zlik savollarni ham jiddiy oling: ular ko'pincha sizning shaxsingizni eng yaxshi ko'rsatadi. Har bir insho sizning yangi qirrangizni ochsin, bir narsani takrorlamang."],
        ru: ["Короткие ответы тоже важны", "Относитесь серьёзно и к вопросам на 50-150 слов: часто они лучше всего показывают личность. Пусть каждое эссе открывает новую сторону, не повторяйтесь."],
        en: ["Short answers count too", "Take the 50-150 word questions seriously: they often show your personality best. Let each essay reveal a new side of you; don't repeat yourself."] },
      { uz: ["Faoliyatlar: fe'l va raqam", "Har bir qatorni kuchli fe'l bilan boshlang va raqamlar keltiring: \"30 o'quvchiga haftalik matematika to'garagini tashkil qildim\". Eng muhim faoliyatni birinchi yozing."],
        ru: ["Активности: глагол и цифры", "Начинайте каждую строку с сильного глагола и приводите цифры: «Организовал еженедельный кружок математики для 30 учеников». Самое важное ставьте первым."],
        en: ["Activities: verbs and numbers", "Start each line with a strong verb and add numbers: \"Organized a weekly math club for 30 students.\" Put the most important activity first."] },
    ] },
    { id: "rec", ic: "users", h: { uz: "Tavsiyanomalar", ru: "Рекомендательные письма", en: "Recommendation letters" }, items: [
      { uz: ["To'g'ri o'qituvchini tanlang", "Eng yuqori baho qo'ygan emas, sizni yaxshi biladigan va darsda faol ko'rgan o'qituvchini tanlang. Odatda 10-11-sinf asosiy fanlaridan ikki o'qituvchi va maktab maslahatchisi (counselor) yozadi."],
        ru: ["Выберите правильного учителя", "Выбирайте не того, кто поставил высшую оценку, а того, кто хорошо вас знает и видел вас активным на уроках. Обычно пишут два учителя основных предметов 10-11 класса и школьный консультант (counselor)."],
        en: ["Choose the right teacher", "Pick not the teacher who gave you the top grade but the one who knows you and has seen you engaged in class. Usually two teachers of core subjects from grades 10-11 plus the school counselor write."] },
      { uz: ["Kamida 1-2 oy oldin so'rang", "Shaxsan, hurmat bilan so'rang, keyin muddatlar, universitetlar ro'yxati va yuborish havolalarini yozma ravishda bering. Oxirgi haftada so'ralgan tavsiyanoma deyarli har doim umumiy chiqadi."],
        ru: ["Просите минимум за 1-2 месяца", "Попросите лично и вежливо, затем дайте в письменном виде сроки, список университетов и ссылки для отправки. Письмо, о котором попросили в последнюю неделю, почти всегда выходит общим."],
        en: ["Ask at least 1-2 months ahead", "Ask in person and politely, then give the deadlines, your list of universities and the submission links in writing. A letter requested in the last week almost always comes out generic."] },
      { uz: ["O'qituvchiga yordam varag'i bering", "Bir sahifada yozing: maqsadlaringiz, uning darsidagi esda qolgan lahzalar, loyihalaringiz, qiyinchilikni qanday yenggansiz. Shunda o'qituvchi aniq misollar bilan yoza oladi."],
        ru: ["Дайте учителю памятку", "На одной странице напишите: ваши цели, запомнившиеся моменты на его уроках, проекты, как вы преодолели трудность. Тогда учитель сможет писать с конкретными примерами."],
        en: ["Give your teacher a brag sheet", "On one page write your goals, memorable moments from their class, your projects and a challenge you overcame. Then the teacher can write with concrete examples."] },
      { uz: ["Yaxshi tavsiyanoma nimadan iborat", "Sifatlar emas, aniq voqealar: \"u aqlli\" emas, \"darsda hech kim yecha olmagan masalani uch usulda yechdi\". Solishtirish ham kuchli: \"20 yillik faoliyatimdagi eng yaxshi 5 o'quvchidan biri\". Hajmi taxminan bir sahifa."],
        ru: ["Из чего состоит хорошее письмо", "Не прилагательные, а конкретные случаи: не «он умный», а «решил тремя способами задачу, которую в классе не решил никто». Сравнение тоже сильно: «один из 5 лучших учеников за 20 лет моей работы». Объём около страницы."],
        en: ["What a strong letter contains", "Specific moments, not adjectives: not \"she is smart\" but \"she solved, three different ways, a problem no one else in class could.\" Comparison is powerful too: \"one of the top 5 students in my 20 years of teaching.\" About one page long."] },
      { uz: ["Halollik va tarjima", "Tavsiyanomani o'zingiz yozib, o'qituvchiga imzolatmang: komissiya buni sezadi va bu halol emas. O'qituvchi o'zbek tilida yozsa, rasmiy tarjima qilinadi; har bir universitetning talabini tekshiring. Oxirida rahmat xati yozing va natijangizni aytib qo'ying."],
        ru: ["Честность и перевод", "Не пишите письмо сами, чтобы учитель только подписал: комиссия это замечает, и это нечестно. Если учитель пишет на узбекском, делается официальный перевод; проверьте требования каждого университета. В конце напишите благодарность и сообщите результат."],
        en: ["Honesty and translation", "Never write the letter yourself for the teacher to sign: readers notice, and it is dishonest. If the teacher writes in Uzbek, an official translation is made; check each university's rules. Afterwards send a thank-you note and tell them your result."] },
    ] },
  ];
  let open = store.get("tips_open", "ai");
  function Screen() {
    const l = L();
    return `${navbar(T("Insho va tavsiyanoma maslahatlari"))}
    <p class="tp-lead">${T("Qabul komissiyasi xodimlari va top universitetlarga qabul qilingan talabalar eng ko'p beradigan maslahatlar.")}</p>
    ${S.map((s) => `<details class="card tp-sec ${s.hot ? "hot" : ""}" ${open === s.id ? "open" : ""} ontoggle="if(this.open){store.set('tips_open','${s.id}')}">
      <summary><i class="tp-ic">${ic(s.ic)}</i><b>${esc(s.h[l])}</b><small>${s.items.length}</small>${ic("chev", "tp-chev")}</summary>
      <ol class="tp-list">${s.items.map((x) => `<li><b>${esc(x[l][0])}</b><p>${esc(x[l][1])}</p></li>`).join("")}</ol></details>`).join("")}
    <p class="note">${T("Har bir universitetning aniq talablarini uning rasmiy saytidan tekshiring.")}</p>`;
  }
  return { Screen };
})();
