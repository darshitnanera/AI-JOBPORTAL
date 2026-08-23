/* =====================================================
   RESUME BUILDER
===================================================== */

const fields = [

    "name",
    "location",
    "phone",
    "email",
    "linkedin",
    "github",
    "leetcode",

    "summary",

    "programming",
    "scripting",
    "databases",
    "frontend",
    "backend",
    "tools",

    "education",

    "internshipTitle",
    "internshipDate",
    "internshipDescription",

    "projects",

    "certifications",

    "hackathons",

    "awards"

];


/* =====================================================
   UPDATE RESUME
===================================================== */

function updateResume() {

    const name =
        document.getElementById("name").value;

    const location =
        document.getElementById("location").value;

    const phone =
        document.getElementById("phone").value;

    const email =
        document.getElementById("email").value;


    document.getElementById("r-name").textContent =
        name || "YOUR NAME";


    document.getElementById("r-location").textContent =
        [location, phone, email]
            .filter(Boolean)
            .join(" | ") ||
        "Location | Phone | Email";


    document.getElementById("r-linkedin").textContent =
        document.getElementById("linkedin").value ||
        "LinkedIn";


    document.getElementById("r-github").textContent =
        document.getElementById("github").value ||
        "GitHub";


    document.getElementById("r-leetcode").textContent =
        document.getElementById("leetcode").value ||
        "LeetCode";


    /* SUMMARY */

    setValue("summary", "r-summary");


    /* SKILLS */

    setValue("programming", "r-programming");
    setValue("scripting", "r-scripting");
    setValue("databases", "r-databases");
    setValue("frontend", "r-frontend");
    setValue("backend", "r-backend");
    setValue("tools", "r-tools");


    /* EDUCATION */

    setValue("education", "r-education");


    /* INTERNSHIP */

    setValue(
        "internshipTitle",
        "r-internshipTitle"
    );

    setValue(
        "internshipDate",
        "r-internshipDate"
    );

    setValue(
        "internshipDescription",
        "r-internshipDescription"
    );


    /* PROJECTS */

    setValue(
        "projects",
        "r-projects"
    );


    /* CERTIFICATIONS */

    setValue(
        "certifications",
        "r-certifications"
    );


    /* HACKATHONS */

    setValue(
        "hackathons",
        "r-hackathons"
    );


    /* AWARDS */

    setValue(
        "awards",
        "r-awards"
    );
}


/* =====================================================
   HELPER
===================================================== */

function setValue(inputId, outputId) {

    const input =
        document.getElementById(inputId);

    const output =
        document.getElementById(outputId);

    if (!input || !output)
        return;

    output.textContent =
        input.value;
}


/* =====================================================
   LIVE UPDATE
===================================================== */

fields.forEach(function(field) {

    const element =
        document.getElementById(field);

    element.addEventListener(
        "input",
        updateResume
    );

});


/* =====================================================
   LOAD EXAMPLE
===================================================== */

function loadExample() {

    document.getElementById("name").value =
        "VANDIT PARMAR";

    document.getElementById("location").value =
        "Babra, Amreli, Gujarat 365421";

    document.getElementById("phone").value =
        "+91 7990889392";

    document.getElementById("email").value =
        "vanditparmar@gmail.com";

    document.getElementById("linkedin").value =
        "linkedin.com/in/vandit-parmar-5a0686293";

    document.getElementById("github").value =
        "github.com/Vandit2006";

    document.getElementById("leetcode").value =
        "Parmar_vandit_11Q";


    document.getElementById("summary").value =
        "B.Tech Information Technology student at Marwadi University with hands-on experience building Android applications, AI/machine learning systems, and scalable full-stack web solutions using Kotlin, Java, Python, PHP, JavaScript, and .NET. Skilled in translating requirements into working software across frontend, backend, and data-driven projects.";


    document.getElementById("programming").value =
        "C, C++, Java, C#, Kotlin";

    document.getElementById("scripting").value =
        "Python, Bash, PHP";

    document.getElementById("databases").value =
        "MySQL, MongoDB";

    document.getElementById("frontend").value =
        "HTML, CSS, JavaScript, React, Bootstrap, Tailwind CSS, Next.js";

    document.getElementById("backend").value =
        "Node.js, Express.js, REST APIs";

    document.getElementById("tools").value =
        "Git, GitHub, TensorFlow, Keras, Scikit-learn, Flask";


    document.getElementById("education").value =
        "Bachelor of Technology in Information Technology — Marwadi University    2023 – 2027\nCGPA: 7.72\n\nHigher Secondary Education (GSEB) — Kamalshi High School, Babra    2022 – 2023\nPercentage: 60% | Percentile: 76.96\n\nSecondary Education (GSEB) — V. L. Gelani, Babra    2020 – 2021\nPercentage: 64.33% | Percentile: 69.34";


    document.getElementById("internshipTitle").value =
        "Web Development Intern — Prodigy Infotech (Remote)";

    document.getElementById("internshipDate").value =
        "June 2025 – July 2025";

    document.getElementById("internshipDescription").value =
        "● Built responsive websites using HTML, CSS, JavaScript, and PHP, including a personal portfolio site and a weather forecast web application.";


    document.getElementById("projects").value =
        "Music Instrument Recognition — AI Audio Classification System\nPython, TensorFlow, Keras, Librosa, NumPy, Scikit-learn, Flask, REST APIs\n● Developed an AI-based audio classification system to recognize multiple musical instruments using feature extraction (MFCCs, spectrograms) and deep learning models.\n\nOnline Cloth Shop — E-Commerce Web Application\nHTML, CSS, JavaScript, PHP, MySQL\n● Developed a full-stack e-commerce platform enabling users to browse, search, and purchase clothing items with a seamless shopping experience.";


    document.getElementById("certifications").value =
        "Python 101 for Data Science — IBM    Aug 2024 – Dec 2024\n● Completed coursework in advanced Python programming techniques for data science applications.";


    document.getElementById("hackathons").value =
        "Hack The Mountain 5.0 — Marwadi University, Rajkot, Gujarat    Sep 14–15 2024\n● Participated in a national-level, 30-hour hybrid hackathon, developing solutions using Python.";


    document.getElementById("awards").value =
        "● 1st Rank — Teachers' Day 2022 (taught a Physics class as part of the event).\n● 1st Position — Mufest 2026 non-technical event, Reel Knockout (rank based on reel editing).\n● Volunteer — Mufest 2025 (Free Fire, non-technical) and Mufest 2026 (CodeCombat, technical).\n● Soft Skills: Teamwork, Communication, Problem Solving, Leadership.\n● Languages Known: English, Hindi, Gujarati.\n● Interests: Photography, exploring new technologies, reading.";

    updateResume();
}


/* =====================================================
   CLEAR FORM
===================================================== */

function clearForm() {

    fields.forEach(function(field) {

        document.getElementById(field).value = "";

    });

    updateResume();
}


/* =====================================================
   DOWNLOAD PDF
===================================================== */

function downloadPDF() {

    const resume =
        document.getElementById("resume");

    const name =
        document.getElementById("name").value
        || "Resume";


    const options = {

        margin: 0,

        filename:
            name.replace(/\s+/g, "_") +
            "_Resume.pdf",

        image: {
            type: "jpeg",
            quality: 1
        },

        html2canvas: {

            scale: 3,

            useCORS: true,

            letterRendering: true

        },

        jsPDF: {

            unit: "mm",

            format: "a4",

            orientation: "portrait"

        },

        pagebreak: {
            mode: ["avoid-all"]
        }

    };


    html2pdf()
        .set(options)
        .from(resume)
        .save();
}


/* =====================================================
   INITIAL
===================================================== */

updateResume();