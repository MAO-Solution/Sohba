# صحبة (Sohba): ملخص المشروع للتسليم بين الجلسات

> آخر تحديث: ١٣ نوفمبر ٢٠٢٦ (بعد الظهر). الملف ده بيلخص كل اللي اتعمل من أول المشروع، عشان أي جلسة جديدة تكمّل من نفس النقطة.

## ١. الفكرة

ويب آب إسلامي مصري، شعاره **«صاحبك في طريقك لربنا، من أول خطوة»**. الهدف إن أي حد، حتى لو ميعرفش حاجة عن دينه، يتعلم الأساسيات ويفهم ويحفظ القرآن بطريقة تناسب طريقة تفكير المصريين، ويبقى حابب التطبيق ومرتبط بيه.

- **الميزة الأساسية:** «خريطة السورة». كل سورة متقسمة لأسئلة ومقاطع، وكل كلمة مهمة ليها رمز بصري، ومعاها شرح بالعامية المصرية، وحيل للحفظ، ووضع «احفظ».
- **دورة التعلم في كل درس:** افهم (شرح وخريطة) ← احفظ ← **افتكر** (أسئلة) ← **طبّق النهارده** (مهمة عملية) ← **مراجعة متباعدة**.
- **مبادئ ثابتة:**
  - المرجع: كتاب الله وسنة رسوله ﷺ، ومن المصادر المعتمدة بس.
  - **إحنا مش بنفتي.** أي سؤال في الدين بيتوجّه لدار الإفتاء المصرية.
  - مفيش أي محتوى ينزل للناس غير بعد مراجعة متخصص. خالة محمود ممكن توصّلنا لشيخ أزهري.
  - مفيش تصوير لأنبياء ولا صحابة ولا أشخاص. الرسومات رموز بس.
  - حيل الحفظ بتتكتب عليها صراحةً إنها «مساعدة للذاكرة، مش تفسير».
  - **مفيش leaderboards ولا نقط على العبادة** (عشان الرياء)، ومفيش إشعارات أو streaks فيها تأنيب ضمير. التشجيع لطيف.
- **البراند:** صحبة، تحت مظلة **ماو سوليوشنز (MAO Solution)** اللي فيها كمان مشروع فلير. الربط بين المشروعين يبقى في الفوتر وصفحة «عننا» بس، **ومفيش إعلانات جوه الدروس**.
- **ليه اسم «صحبة»:** نفس جذر كلمة «الصحابة».

## ٢. الأقسام (Tracks)

| القسم | الـ slug | المعنى | الحالة |
|---|---|---|---|
| **دار الأرقم** | `start` | ابدأ من الأول (أول مدرسة في الإسلام) | ٤ دروس |
| **الكُتّاب** | `quran` | صحبة القرآن بالخريطة | **جزء عمّ كامل: ٣٧ سورة** |
| **الصُّفّة** | `sunnah` | الأربعين النووية | ١٢ حديث |
| **السيرة كحكاية** | `seerah` | السيرة من مصادر موثقة | ١٠ دروس |
| **اسمع** | `listen` | مكتبة لينكات موثوقة | درس واحد |
| **المواسم** | `mawasim` | قسم مخفي (`is_listed=false`) لدروس المواسم | ٤ دروس |

وفيه كمان «وِرد اليوم» على الصفحة الرئيسية: آية ودعاء بيتغيروا كل يوم.

## ٣. المحتوى الموجود (٦٨ درس، **كله `in_review`**)

- **دار الأرقم:** الشهادتين، وأركان الإيمان، والوضوء، والصلاة.
- **الكُتّاب:** جزء عمّ كله، من الناس (sort 1) للنبأ (sort 37). ٥٦٤ آية.
- **الصُّفّة (مرتبة برقم الحديث):** ١ النيات، ٢ جبريل، ٣ بني الإسلام، ٥ من أحدث، ٧ النصيحة، ١٢ ما لا يعنيه، ١٣ يحب لأخيه، ١٥ فليقل خيرًا، ١٦ لا تغضب، ١٨ اتق الله حيثما كنت، ٣٩ الخطأ والنسيان، ٤٠ كن في الدنيا كأنك غريب.
- **السيرة:** المولد واليُتم، والصادق الأمين، وغار حراء، ودار الأرقم، وعلى جبل الصفا، و«أحد أحد»، والحبشة، وعام الحزن، والطائف، والهجرة.
- **المواسم:** الجمعة، ورمضان، والعشر من ذي الحجة، و«كلمتين خفاف» (للشريط الدائم).
- كل درس تقريبًا فيه سؤال أو اتنين في «افتكر» ومهمة في «طبّق النهارده».

**مصادر النصوص (بتتنقل بسكريبت حرف بحرف، مش من الذاكرة):**
- القرآن: `fawazahmed0/quran-api`، edition `ara-quransimple` (حفص).
- التفسير الميسر: `spa5k/tafsir_api`، slug `ar-tafsir-muyassar`. في الآية الأولى من كل سورة النص بييجي بعد `[التفسير]`.
- الأحاديث: `fawazahmed0/hadith-api` (`ara-nawawi`، `ara-bukhari`، `ara-muslim`، `ara-abudawud`).
- كلهم على `raw.githubusercontent.com`، وده متاح من الـ sandbox.

**اللي اتأكدنا منه وما اتأكدناش منه:**
- ✅ نص القرآن والتفسير الميسر في الـ ٣٧ سورة منقولين من المصدر.
- ✅ نصوص الأربعين وأحاديث البخاري ومسلم وأبي داود اللي في الدروس الجديدة منقولة من المصدر.
- ⚠️ الدروس الأولى (الشهادتين والإيمان والنيات و«يحب لأخيه» و«فليقل خيرًا» والسيرة ١–٣) اتكتبت قبل ما نستخدم المصادر، **ومحتاجة مراجعة حرف بحرف**. وأرقام الأحاديث لسه متضافتش.
- ⚠️ دروس الفقه (الوضوء والصلاة) ملخصات ملتزمة بالمتفق عليه، ولازم تتراجع.
- ⚠️ الشرح بالمصري، وحيل الحفظ، وحكايات السيرة، والأسئلة، والمهام، كلهم محتاجين مراجعة.

## ٤. التقنية

- **الـ Stack:** Node.js 22 + Express + PostgreSQL + Vanilla JS (PWA)، ومن غير أي dependencies غير `express` و`pg`.
- **الـ Repo:** `github.com/MAO-Solution/Sohba`، والفرع `main`. الـ repo **Public**.
- **الفكرة المعمارية:** محرك واحد، `tracks → lessons → blocks`. أي قسم أو موسم جديد بيبقى بيانات في `content/` من غير كود جديد.

```
content/          ← tracks.json, sources.json, seasons.json, lessons/*.json
db/migrations/    ← 001_init … 006_interactive
db/migrate.js, db/seed.js, db/content.js
server/app.js     ← Express app (exported)، و/admin shell
server/auth.js    ← scrypt + session cookie بـ HMAC
server/routes/api.js, server/routes/admin.js
app.js            ← Vercel entry (لازم يعمل import express مباشر)
public/           ← index.html, admin.html, css/{app,admin}.css, js/{app,admin}.js, sw.js
scripts/build-preview.js ← dist/preview.html (ملف واحد)
scripts/create-user.js   ← npm run user
```

**الـ Schema:**
- `tracks(slug, title, subtitle, sort, is_available, is_listed)`
- `lessons(…, status ENUM draft|in_review|approved|published, reviewed_by, reviewed_at, content_hash)`. فيه CHECK بيمنع `approved` أو `published` من غير `reviewed_by`.
- `blocks(lesson_id, sort, type, content JSONB, source_id)`. فيه CHECK بيمنع `quran` أو `hadith` أو `dua` من غير مصدر.
  - أنواع البلوكات: `heading, text, egy, quran, hadith, dua, step, list, tip, note, map, memorize, link, ticker, quiz, action`
  - `quran`: `{surah, ayah, body, egy, tafsir, tafsir_to?}`. لو التفسير الميسر بيشرح كذا آية مع بعض، الفقرة بتتحط على أول آية بس، ومعاها `tafsir_to`.
  - `quiz`: `{q, options[], answer, why}`. الـ seed بيرفض أي `answer` برا الاختيارات.
  - `action`: `{body}`. و`ticker`: `{items[]}`، وده بيظهر في الشريط بس، مش جوه الدرس.
- `sources(key, kind, title, ref, url)`: `mushaf, muyassar, bukhari-muslim, bukhari, muslim, raheeq, tirmidhi, ibn-majah, abu-dawud`
- `seasons(key, lesson_id, rule JSONB, theme, sort)`
- `users(…, role admin|reviewer|NULL)`، و`lesson_reviews` (سجل المراجعة)، و`auth_failures` (حماية الـ login)، و`progress` (لسه مش مستخدم).

**الـ seed:**
- الـ `status` اللي في الـ JSON بيتاخد **أول مرة بس**، وحالة المراجعة مكانها الـ DB.
- لو محتوى درس `approved` أو `published` اتغير (`content_hash`)، بيرجع `in_review` وبيتسجل `content_changed`. **يعني الدرس المنشور بيختفي من الناس لحد ما يتراجع تاني.**
- البلوكات بتتكتب تاني بس لو المحتوى اتغير، فالـ IDs ثابتة.
- فيه advisory lock عشان deploy-ين ميعملوش seed في نفس الوقت.

**الـ API:**
- `GET /api/tracks` (اللي `is_listed` بس)، و`/api/tracks/:slug`، و`/api/lessons/:slug`، و`/api/daily`، و`/api/seasons`، و`/healthz`
- `/admin/api`: `login`، و`logout`، و`me`، و`lessons?status=`، و`lessons/:slug`، و`POST lessons/:slug/review {action, content_hash, note}`

**Workflow المراجعة (`/admin`):**
```
draft ──submit (admin)──▶ in_review ──approve (reviewer)──▶ approved ──publish (admin)──▶ published
        ◀──request_changes + note (reviewer)──┘                    ◀──unpublish (admin)──┘
```
- الشيخ (`reviewer`) هو بس اللي يقدر يعتمد. وكل زرار بيبعت `content_hash` النسخة اللي المستخدم شايفها، ولو الدرس اتغير بيرجع `409`.
- الـ session في cookie متوقّعة بـ HMAC ومربوطة بالـ password hash، و`SameSite=Strict`. الـ requests لازم تكون JSON ومن نفس الـ origin. بعد ٥ محاولات غلط لنفس الإيميل الـ login بيتقفل ربع ساعة.
- الحسابات بتتعمل من الجهاز: `npm run user -- --email … --name "…" --role reviewer|admin|none`

**المواسم:** `content/seasons.json` بيحتوي قواعد زي `{"weekday":5}` و`{"hijri_month":9}` و`{"hijri_month":12,"from":1,"to":10}` و`{"always":true}`، ولكل قاعدة `shift` اختياري.
- الواجهة بتحسب التاريخ الهجري بـ `Intl` (أم القرى).
- أول موسم شغال بيحدد الثيم (`friday`، `ramadan`، `hajj`).
- الشريط بياخد جمله من بلوكات `ticker`.
- للتجربة: `/?date=YYYY-MM-DD`.

**الدرس التفاعلي (كله على الجهاز في `localStorage`):**
- `sohba-srs`: المراجعة بعد ١ و٣ و٧ و١٤ و٣٠ يوم، ولو المستخدم غلط بيرجع لأول خطوة.
- `sohba-acts`: الرئيسية بتسأل تاني يوم «عملتها؟».
- `sohba-done`: الدروس اللي خلصت.
- `#review`: صفحة «مراجعة النهارده».

**الـ Service Worker (`sohba-v2`):** network-first لكل حاجة، وملفات التطبيق بتتأكد من السيرفر في كل مرة (`no-cache`). **متغيرش ده لـ cache-first** (المشكلة دي حصلت قبل كده: الناس فضلت على النسخة القديمة).

**الأمان:** كل الـ queries بـ parameters، وفيه rate limit في الذاكرة على `/api`، وsecurity headers، وCSP صارم على `/admin`، وكل النصوص بتتعمل لها escape في الواجهة.

## ٥. الـ Hosting

- **التطبيق:** Vercel (Hobby). اللينك: **https://sohba-indol.vercel.app**
  - `vercel-build` بيعمل migrate وseed **في الـ production بس** (`VERCEL_ENV=production`). الـ preview deploys بتاعة الـ PRs مبتلمسش الداتابيز.
  - Environment Variables: `DATABASE_URL`، و`PREVIEW_DRAFTS=true`، و**`SESSION_SECRET`** (٣٢ حرف أو أكتر، ومن غيره `/admin` بتبقى مقفولة).
  - الأحسن تغيير الـ Function Region لـ `fra1`.
- **الداتابيز:** Neon Free، مشروع `Sohba`، في Frankfurt. الـ Data API المفروض يتقفل.
- **الدومين:** لسه متشتراش. الاقتراحات: `sohba.app` أو `getsohba.com`.

## ٦. اللينكات

- الموقع: https://sohba-indol.vercel.app، ولوحة المراجعة: https://sohba-indol.vercel.app/admin
- النسخة التجريبية (ملف واحد): https://claude.ai/artifact/ScxrJDn5rTvm6Ba7iksJwY
- أول نموذج لسورة الناس: https://claude.ai/artifact/MJfYgjCoPquWnzPWYhfSdZ
- الـ Whiteboard بخطة الإطلاق: https://claude.ai/artifact/WtPsCCX8husvxbciJWqL3U

## ٧. الخطوات الجاية (بالترتيب)

1. **تفعيل المراجعة:** `SESSION_SECRET` على Vercel، وحساب لمحمود (`admin`) وحساب للشيخ (`reviewer`)، وبعدين الشيخ يراجع من `/admin`.
2. **PR 3:** connection pool على Neon (الـ pooled URL، و`max` ١ أو ٢ على serverless)، والـ region `fra1`.
3. **الحسابات الاختيارية** ومزامنة `sohba-srs` و`sohba-acts` مع الـ DB (جدول `progress` مع upsert بـ `ON CONFLICT`).
4. **مجموعات الصحبة:** ٣ لـ ٥ أصحاب يحفظوا مع بعض ويشجعوا بعض، من غير ترتيب ولا نقط. محتاجة الحسابات الأول.
5. **موسم رمضان:** خطة «جزء عمّ في ٣٠ يوم» (المحتوى جاهز) ودرس صيام يومي. رمضان ١٤٤٨ تقريبًا ٨ فبراير ٢٠٢٧.
6. **مشاركة خريطة السورة كصورة على واتساب.**
7. **محتوى أكتر:** باقي الأربعين، والسيرة بعد الهجرة، وفقه الصيام. وفي «اسمع» قنوات وبودكاستات يختارها محمود.
8. **الإطلاق:** تجربة مقفولة مع ٢٠ لـ ٣٠ شخص لمدة أسبوعين. بعدها `PREVIEW_DRAFTS=false`، والدومين، والإطلاق العلني قبل رمضان بشهر.

## ٨. طريقة الشغل مع محمود

- الأسلوب: «ديب»، Senior System Architect. كلام مباشر بالمصري، والكود والمصطلحات بالإنجليزي.
- **Approve-First** في الكود: الخطة الأول، وبعدها مستني «Go» أو «موافق». وPRs الكود محمود هو اللي بيعمل لها merge.
- **المحتوى:** محمود قال نضيف كتير ومش مشكلة، لأن كله `in_review` والشيخ هيراجع على دفعات. فـ PRs المحتوى بتتعمل لها merge على طول.
- التعديلات على الملفات الموجودة تتعرض كـ Diff بس.
- Lean ومن غير over-engineering.
- الاختبار: Postgres 16 محلي (`/tmp/pgdata` على port 5433، بيقف بين الأدوار فلازم يتشغل تاني)، وChrome headless بـ Playwright.
