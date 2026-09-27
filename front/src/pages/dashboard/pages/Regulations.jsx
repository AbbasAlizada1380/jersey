import { FaDownload, FaFilePdf } from "react-icons/fa";

const Regulation = ({ companyName = " کارگوی شما", data }) => {
	const downloadRegulationPDF = () => {
		const printWindow = window.open("", "_blank", "width=800,height=900");
		if (!printWindow) {
			alert("لطفاً پاپ‌آپ را برای پرینت مجاز کنید");
			return;
		}

		const isoDate = data.date;

		const persianDate = new Intl.DateTimeFormat("fa-IR-u-nu-arabext", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(new Date(isoDate));

		const docNumber = data?.id.toLocaleString("fa-IR");

		// Get the logo URL - assuming it's hosted at /logo.png
		const logoUrl = window.location.origin + "/logo.png";

		printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>مقررات انتقال محموله - ${companyName}</title>
        <style>
          /* Reset and base styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Tahoma', 'Arial', sans-serif;
          }

          /* A4 Page Size - Prevent empty second page */
          @page {
            size: A4 portrait;
            margin: 0mm;
          }

          body {
            direction: rtl;
            background: white;
            color: #000;
            line-height: 1.9;
            width: 210mm;
            min-height: 297mm;
            max-height: 297mm;
            margin: 0;
            padding: 0;
            font-size: 20px;
            overflow: hidden;
          }

          /* Main container matching A4 dimensions */
          .a4-container {
            width: 210mm;
            min-height: 297mm;
            max-height: 297mm;
            background: white;
            margin: 0mm auto;
            position: relative;
            padding-right:20mm;
            overflow: hidden;
          }

          /* Header - Compact version */
          .print-header {
            background: #0f3a76;
            color: white;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .logo-circle {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            flex-shrink: 0;
          }

          .logo-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .company-info {
            display: flex;
            flex-direction: column;
            text-align: right;
          }

          .company-name-fa {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 2px;
          }

          .company-name-en {
            font-size: 14px;
            opacity: 0.95;
          }

          .header-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justity:center;
            gap: 3px;
          }

          .doc-info-item {
            font-size: 9px;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .doc-info-label {
            font-weight: bold;
            color: #dbeafe;
          }

          .doc-info-value {
            font-weight: 600;
          }

          /* Introduction Box - Compact */
          .intro-box {
            background: #f0f9ff;
            border-right: 2px solid #1e40af;
            border-radius: 3px;
            padding: 8px 10px;
            margin-top:4px;
          }

          .intro-text {
            font-size: 12px;
            color: #1e3a8a;
            font-weight: 600;
            line-height: 1.5;
          }

          /* Section Styling - Compact */
          .section {
            margin: 0;
          }

          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e3a8a;
          }

          /* Regulations List - Compact */
          .regulations-list {
            margin: 0;
            padding-right: 18px;
            list-style: none;
            counter-reset: regulation-counter;
          }

          .regulation-item {
            margin-bottom: 6px;
            text-align: right;
            font-size: 11px;
            line-height: 1.5;
            position: relative;
            padding-right: 20px;
          }

          .regulation-item:before {
            counter-increment: regulation-counter;
            content: counter(regulation-counter) ". ";
            position: absolute;
            right: 0;
            color: #1e40af;
            font-weight: bold;
            font-size: 11px;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Compact spacing for lists */
          .regulations-list.compact {
            margin-bottom: 4px;
          }

          /* Contact Information - Compact */
          .contact-section {
            background: #0f3a76;
            padding:16px;
          }

          .contact-title {
            font-size: 16px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 6px;
            text-align: center;
          }

          .contact-item {
            display: flex;
            align-items: center;
            gap: 6px;
            color:#ffffff;
            font-size: 16px;
          }

          /* Signature Section */
          .signature-section {
            border-top: 1px solid #d1d5db;
            margin-top: 16px;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .signature-box {
            width: 48%;
            border: 1px solid #d1d5db;
            text-align: center;
            height: 86px;
          }

          .signature-title {
            font-size: 12px;
            margin-top: 5px;
            font-weight: bold;
            color: #1e3a8a;
          }

          .signature-area {
            position: relative;
            display: flex;
            align-items: flex-end;
            justify-content: center;
          }

          .signature-label {
            font-size: 10px;
            color: #666;
          }
          .signature-name {
            font-size: 11px;
            padding-top: 24px;
            font-weight: bold;
            color: #1e3a8a;
            text-align: center;
            width: 100%;
          }

          /* Footer - Compact */
          .footer {
            margin-top: 16px;
            padding-top: 8px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 9px;
            color: #6b7280;
          }

          .footer-company {
            font-weight: bold;
            color: #4b5563;
            margin-bottom: 3px;
          }

          /* Print Optimization - Prevent second page */
          @media print {
            body {
              margin: 0 !important;
              padding: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              background: white !important;
              font-size: 12px !important;
              overflow: hidden !important;
            }

            .a4-container {
              width: 210mm !important;
              height: 297mm !important;
                       box-shadow: none !important;
              border: none !important;
              overflow: hidden !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
            }

            .print-header {
              background: #0f3a76 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .logo-img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Prevent page breaks and empty pages */
            body * {
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
            }

            html, body {
              height: 100% !important;
              overflow: hidden !important;
            }
          }

          /* Text clarity improvements */
          .regulation-item {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        </style>
      </head>
      <body>
        <div class="a4-container">
          <!-- Header - Compact -->
          <div class="print-header">
            <div class="header-left">
              <div class="logo-circle">
                <img src="${logoUrl}" alt="Company Logo" class="logo-img" />
              </div>
              <div class="company-info">
                <div class="company-name-fa">${companyName}</div>
                <div class="company-name-en">your Cargo Services</div>
              </div>
            </div>
            <div class="header-right">
              <div class="doc-info-item">
                <span class="doc-info-label">شماره بل:</span>
                <span class="doc-info-value">${docNumber}</span>
              </div>
              <div class="doc-info-item">
                <span class="doc-info-label">تاریخ:</span>
                <span class="doc-info-value">${persianDate}</span>
              </div>
            </div>
          </div>

          <!-- Introduction -->
          <div class="intro-box">
            <p class="intro-text">قرارداد انتقال محموله بین شرکت ${companyName} و مشتری محترم ${
			data?.Sender?.name || "مشتری"
		} به شرح ذیل تنظیم شده است</p>
          </div>

        <!-- Company Responsibilities -->
<div class="section">
  <h2 class="section-title">مکلفیت‌های شرکت</h2>
  <ol class="regulations-list">
    <li class="regulation-item">شرکت  کارگوی شما مکلف است تا از مسیر قانون محموله‌های خود را انتقال بدهد.</li>
    <li class="regulation-item"> کارگوی شما مکلف به نگهداری از اجناس در تمام مواقع می‌باشد و در صورتی که ثابت شود در نتیجه بی تفاوتی کارمندان  کارگوی شما به محموله آسیب رسیده است در مقابل مشتری جوابگو می‌باشیم.</li>
    <li class="regulation-item"> کارگوی شما با استفاده از سیستم ردیابی معیاری خود که در وبسایت شرکت‌های بین‌المللی درج می‌باشد به مشتریان خود یک نمبر ردیابی ده رقمی ارائه می‌دارد که با آن نمبر مشتریان قابلیت ردیابی محموله خود را به طور ۲۴ ساعته از دوبی الی آدرس مقصد را داشته باشند.</li>
    <li class="regulation-item"> کارگوی شما صرفاً مکلف به انتقال بسته‌ها بوده و در صورت مفقودی کلی و یا قسمی و همچنین تخریب کلی و یا قسمی محموله‌های که بیمه شده است و در ضمن توسط فرستنده ثابت شود مکلف به جبران خساره است. برای محموله‌های که بیمه نشده باشد طبق قوانین شرکت‌های بین‌المللی رسیدگی خواهد شد.</li>
    <li class="regulation-item">در صورت مواجه شدن با محدودیت در امور انتقال محموله توسط گمرکات کشور مبدأ، کشور مقصد یا کشورهای مسیر،  کارگوی شما هیچ نوع مسؤولیت در این قبال ندارد.</li>
    <li class="regulation-item">در صورتی که گمرکات کشورهای مبدأ, مقصد و یا مسیر به محموله مشتری مشکوک گردد و بخواهند بررسی نمایند و در هنگام بازرسی سبب تخریب قسمتی یا کلی اجناس در اثر بریدگی یا برمه کاری گردد،  کارگوی شما هیچ نوع مسؤولیت در این قبال ندارد.</li>
  </ol>
</div>

<!-- Sender Responsibilities -->
<div class="section">
  <h2 class="section-title">مکلفیت‌های شخص فرستنده</h2>
  <ol class="regulations-list compact" start="7">
    <li class="regulation-item">شخص فرستنده مکلف به درج معلومات صحیح و مکمل خود (فرستنده) و شخص گیرنده می‌باشد.</li>
    <li class="regulation-item">در صورت درج شدن معلومات نادرست توسط فرستنده، اگر محموله توسط نهادهای ذیربط برگردانده شود، مبلغ یا کرایه ارسال بسته اعاده نشده و مبلغ برگشت بسته نیز به عهده فرستنده می‌باشد.</li>
    <li class="regulation-item">اگر اشیای قیمتی بدون بیمه و درج قیمت صحیح توسط  کارگوی شما ارسال گردد، در صورت تخریب یا مفقود شدن یا وضع شدن هزینه‌های انبارداری (Storage) و تأخیر (Demurrage)، کرایه اخذ شده قابل استرداد نمی‌باشد.</li>
    <li class="regulation-item">ارسال پول نقد، زیورات قیمتی، مایعات، ادویه توسط  کارگوی شما قابل انتقال نیستند.</li>
    <li class="regulation-item">محموله مذکور باید مطابق جواز تجاری به کشور مقصد صادر گردد. در صورتی که محموله غیرقانونی (مانند مواد مخدر، مواد نشه‌آور، مواد انفجاری و تمام اموال غیرقانونی که خلاف قوانین ملی و بین‌المللی باشد و نگهداری آنها جرم شمرده شود) در این محموله جابجا شده باشد، مسؤولیت قانونی (شامل مسؤولیت جزایی) آن به عهده شخص فرستنده می‌باشد.بنا بر این اینجانب ${
			data.Sender.name
		} دارنده نمبر تذکره ............... تعهد مینمایم که هیچ نوع مواد ممنوعه فوق الذکر در محموله جاسازی و جابجا نشده در صورت کشف چنین موردی،  کارگوی شما هیچ نوع مسؤولیتی ندارد و در قبال چنین موارد به نهاد های مربوطه مسوول پاسخگو میباشم.</li>
    <li class="regulation-item">در صورتی که در کشورهای مبدأ، مسیر یا مقصد، محموله شما مورد ارزیابی و تحقیقات امنیتی قرار گیرد، در صورت تقاضای جدی آنها، مشتری مکلف به ارائه معلومات در مورد اموال و بسته‌های خود می‌باشد.</li>
    <li class="regulation-item">هرگاه بر محموله در کشور مقصد مالیات و سایر مصارف حکومتی وضع شود، شخص گیرنده مکلف به پرداخت آن می‌باشد.</li>
    <li class="regulation-item">در صورت پیش آمدن حالات غیرمترقبه مثل: اتفاقات طبیعی، آتش‌سوزی، کودتا، جنگ، محدودیت‌ها بالای حکومت افغانستان و امثال آن، که محموله به تأخیر مواجه شود،  کارگوی شما هیچ‌گونه مسؤولیتی ندارد.</li>
    <li class="regulation-item">پرداخت حق‌العمل و مصارف انتقال اموال به صورت پیش‌پرداخت توسط شخص فرستنده در کابل قابل پرداخت است.</li>
    <li class="regulation-item">شخص گیرنده مکلف است در صورت نیاز به گمرکات کشور مقصد، اسناد لازم را ارائه دهد. در صورتی که شخص گیرنده مشکلاتی مانند نداشتن اسناد قانونی، بدهی دولتی، عدم موجودیت در آدرس داده شده، قرار گرفتن در وضعیت‌های اضطراری و غیره داشته باشد که شرکت بین‌المللی نتواند محموله را تحویل دهد،  کارگوی شما هیچ نوع مسؤولیتی ندارد.</li>
    <li class="regulation-item">شخص گیرنده مکلف است حین باز کردن بسته از جزئیات آن فیلم گرفته تا در صورت کمبود یا آسیب، مستندسازی شود.</li>
    <li class="regulation-item">شخص فرستنده مکلف است تا در هنگام تسلیم اجناس خود به  کارگوی شما، این شرایط را به دقت مطالعه نموده و با آگاهی کامل این قرارداد را که دارای 17 ماده می‌باشد، امضا نماید. همچنین این قرارداد بعد از تسلیم مال به کشور مقصد توسط شخص گیرنده قابل اعتبار نیست.</li>
    <li class="regulation-item">اینجانب ${
			data.Sender.name
		} این قرداد را مطالعه نمودم و تمام شرایط آنرا خواندم و قبول میدارم </li>
  </ol>
</div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-title">امضاء و مهر شرکت</div>
              <div class="signature-area company-signature">
                <div class="signature-name">${companyName}</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-title">امضاء مشتری</div>
              <div class="signature-area customer-signature">
                <div class="signature-name">${
									data?.Sender?.name || "مشتری"
								}</div>
              </div>
            </div>
          </div>

          <div class="contact-section">
            <div class="contact-grid">
              <div class="contact-item">

                <span>تماس: ۰۷۸۰۱۷۷۰۶۰ - ۰۷۷۹۷۱۰۹۹۶ </span>
              </div>
              <div class="contact-item">

                <span>آدرس: مارکیت بهار سراب، تانک تیل، دشت برچی، کابل، افغانستان</span>
              </div> 
            </div>
          </div>
        </div>

        <script>
          // Preload the logo image before printing
          const logoImg = new Image();
          logoImg.src = "${logoUrl}";
          
          logoImg.onload = function() {
            console.log('Logo loaded successfully');
          };
          
          logoImg.onerror = function() {
            console.log('Logo failed to load, using fallback');
          };

          // Auto print with delay to ensure rendering
          window.onload = function() {
            window.focus();
            setTimeout(function() {
              window.print();
            }, 500); // Increased delay for image loading
          };

          // Fallback if onload doesn't fire
          setTimeout(function() {
            if (document.readyState === 'complete') {
              window.print();
            }
          }, 1500);
        </script>
      </body>
      </html>
    `);

		printWindow.document.close();
	};

	return (
		<div className="flex justify-center p-4">
			<button
				onClick={downloadRegulationPDF}
				className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-800 
                   text-white rounded-lg hover:from-blue-700 hover:to-blue-900 
                   shadow-md hover:shadow-lg border border-blue-500"
			>
				<FaFilePdf className="text-lg" />
				<FaDownload className="text-md" />
				<span className="font-semibold">دانلود مقررات شرکت</span>
			</button>
		</div>
	);
};

export default Regulation;
