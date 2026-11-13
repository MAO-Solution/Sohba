# صحبة (Sohba)

صاحبك في طريقك لربنا، من أول خطوة. من ماو سوليوشنز.

PWA بـ Node/Express + PostgreSQL + Vanilla JS.

## الفكرة التقنية: محرك واحد

`tracks → lessons → blocks`. أي مسار جديد (السنة، السيرة، ...) هو **بيانات في `content/`** مش كود جديد.

- المحتوى كله في `content/` كملفات JSON، وده بيخلي المراجعة الشرعية تتعمل على Git.
- أي درس حالته مش `published` مبيوصلش للناس. والـ DB نفسها بترفض `approved` أو `published` من غير `reviewed_by`.
- أي آية أو حديث أو دعاء لازم يكون ليه `source`، والـ DB بترفض غير كده.
- حالة المراجعة مكانها الـ DB مش Git: الـ `status` اللي في الـ JSON بيتاخد بس أول مرة الدرس يتضاف. بعد كده الـ seed مبيلمسهاش، إلا لو محتوى درس `approved` أو `published` اتغير (`content_hash`)، ساعتها بيرجع `in_review` لوحده عشان يتراجع تاني.

## التشغيل

```bash
cp .env.example .env        # حط DATABASE_URL
npm install
npm run migrate
npm run seed                # يتعاد بأمان بعد أي تعديل في content/
npm run dev                 # http://localhost:3000
```

`PREVIEW_DRAFTS=true` بيعرض المسودات (للتطوير والمراجعة بس).

`npm run build:preview` بيطلع `dist/preview.html`: نسخة ملف واحد تشتغل من غير سيرفر.

## الـ Deploy (Vercel + Neon، من غير كارت)

1. اعمل import للـ repo من vercel.com/new. هيتعرف على Express لوحده من `app.js`.
2. ضيف Environment Variables: `DATABASE_URL` (من Neon) و`PREVIEW_DRAFTS=true` لحد الإطلاق.
3. `vercel-build` بيشغّل الـ migrate والـ seed مع deploy الـ **production** بس. الـ preview deploys (بتاعة الـ PRs) مبتلمسش الداتابيز.

`render.yaml` موجود كبديل لو حبينا سيرفر دايم.

## المواسم

`content/seasons.json` بيحدد إمتى كل موسم يظهر، وكل موسم بيشاور على درس عادي في قسم مخفي (`mawasim`)، فنصوصه بتعدي على نفس المراجعة الشرعية.

| القاعدة | المعنى |
|---|---|
| `{"weekday":5}` | كل جمعة |
| `{"hijri_month":9}` | رمضان كله |
| `{"hijri_month":12,"from":1,"to":10}` | العشر من ذي الحجة |
| `{"always":true}` | طول الوقت (للشريط) |

- التاريخ الهجري بيتحسب على جهاز المستخدم بتقويم أم القرى (`Intl`). لو رؤية الهلال في مصر اختلفت، ضيف `"shift": 1` أو `-1` للقاعدة.
- أول موسم شغال وليه `theme` بيغيّر ألوان التطبيق (`friday`, `ramadan`, `hajj`).
- بلوك `ticker` في درس الموسم بيغذّي الشريط اللي تحت الهيدر.
- للتجربة: `/?date=2027-02-15`.

## الـ API

| Route | |
|---|---|
| `GET /api/tracks` | المسارات وعدد الدروس |
| `GET /api/tracks/:slug` | المسار ودروسه |
| `GET /api/lessons/:slug` | الدرس بالبلوكات والمصادر والدرس اللي بعده |
| `GET /api/daily` | وِرد اليوم: آية ودعاء، ثابتين طول اليوم |
| `GET /api/seasons` | المواسم وقواعدها وجمل الشريط (المراجعة بس) |
| `GET /healthz` | فحص السيرفر والـ DB |

## المراجعة الشرعية (`/admin`)

```
draft ──ابعته للمراجعة (admin)──▶ in_review ──اعتمد (reviewer)──▶ approved ──انشر (admin)──▶ published
          ◀──محتاج تعديل + ملاحظة (reviewer)──┘                            ◀──اسحب من النشر──┘
```

- الشيخ (`reviewer`) هو بس اللي يقدر يعتمد أو يرجّع درس. الأدمن ميقدرش يعتمد.
- كل زرار بيبعت `content_hash` النسخة اللي المستخدم شايفها. لو الدرس اتغيّر في النص، العملية بترجع `409`.
- كل حركة بتتسجل في `lesson_reviews` (مين، إمتى، من إيه لإيه، على أنهي نسخة، والملاحظة).
- تعديل نص درس `approved` أو `published` في Git بيرجّعه `in_review` في الـ deploy الجاي، **وبيختفي من الناس** لحد ما يتراجع تاني.

**التفعيل:** حط `SESSION_SECRET` (٣٢ حرف عشوائي أو أكتر) في Environment Variables. من غيره `/admin` مقفولة. وبعدين اعمل الحسابات من جهازك على الـ DB:

```bash
npm run user -- --email sheikh@example.com --name "الشيخ فلان" --role reviewer
npm run user -- --email you@example.com --name "محمود" --role admin
```

الباسورد بيتسأل عنه interactive (١٢ حرف على الأقل). لو شغّلت نفس الأمر تاني بيعمل reset للباسورد وبيطلّع كل الـ sessions، و`--role none` بيشيل الصلاحية.

## الجاي

- الحسابات الاختيارية ومزامنة المراجعة المتباعدة (`progress`)
