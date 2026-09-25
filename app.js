// TU BSc CSIT DBMS Portal - Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentYearId = PORTAL_DATA.examYears[0].id;
    let currentTab = 'question-banks';
    let searchQuery = '';
    let isDarkMode = localStorage.getItem('dbms_theme') === 'dark';

    // DOM Elements
    const yearListEl = document.getElementById('yearList');
    const examPaperEl = document.getElementById('examPaperContent');
    const searchInput = document.getElementById('globalSearch');
    const themeToggleBtn = document.getElementById('themeToggle');
    const printBtn = document.getElementById('printBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Initialize Theme
    function applyTheme() {
        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggleBtn.innerHTML = `<span>☀️</span> Light Mode`;
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggleBtn.innerHTML = `<span>🌙</span> Dark Mode`;
        }
    }
    applyTheme();

    themeToggleBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        localStorage.setItem('dbms_theme', isDarkMode ? 'dark' : 'light');
        applyTheme();
    });

    // Print functionality
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Tab Navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    function switchTab(tabId) {
        currentTab = tabId;
        tabBtns.forEach(b => {
            if (b.getAttribute('data-tab') === tabId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        tabPanes.forEach(pane => {
            if (pane.id === `tab-${tabId}`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
        window.location.hash = tabId;
        window.scrollTo({ top: 220, behavior: 'smooth' });
    }

    // Read initial hash
    if (window.location.hash) {
        const hashTab = window.location.hash.replace('#', '');
        const validTabs = ['question-banks', 'syllabus', 'matrix', 'recall', 'chapters', 'books', 'practical'];
        if (validTabs.includes(hashTab)) {
            switchTab(hashTab);
        }
    }

    // Render Years Sidebar
    function renderYearSidebar() {
        yearListEl.innerHTML = '';
        PORTAL_DATA.examYears.forEach(y => {
            const btn = document.createElement('button');
            btn.className = `year-btn ${y.id === currentYearId ? 'active' : ''}`;
            btn.innerHTML = `
                <span>DBMS Question Bank ${y.year}</span>
                <span class="badge-count">${y.question_count} Qs</span>
            `;
            btn.addEventListener('click', () => {
                currentYearId = y.id;
                renderYearSidebar();
                renderExamPaper();
                window.scrollTo({ top: 320, behavior: 'smooth' });
            });
            yearListEl.appendChild(btn);
        });
    }

    // Render Exam Paper Questions & Solutions
    function renderExamPaper() {
        const yearData = PORTAL_DATA.examYears.find(y => y.id === currentYearId);
        if (!yearData) return;

        // Filter questions if search is active
        let filteredQuestions = yearData.questions;
        if (searchQuery.trim() !== '') {
            const qLower = searchQuery.toLowerCase();
            filteredQuestions = yearData.questions.filter(q => 
                q.title.toLowerCase().includes(qLower) || 
                q.solution.toLowerCase().includes(qLower)
            );
        }

        let paperHtml = `
            <div class="exam-paper-header">
                <h2>Tribhuvan University</h2>
                <h3>Institute of Science and Technology</h3>
                <div class="exam-year-tag">${yearData.full_title}</div>
                <div class="exam-meta-grid">
                    <div><strong>Level:</strong> ${PORTAL_DATA.course.level}</div>
                    <div><strong>Course:</strong> ${PORTAL_DATA.course.program}</div>
                    <div><strong>Subject:</strong> ${PORTAL_DATA.course.title} (${PORTAL_DATA.course.code})</div>
                    <div><strong>Time:</strong> ${PORTAL_DATA.course.time}</div>
                    <div><strong>Full Marks:</strong> ${PORTAL_DATA.course.fullMarks}</div>
                    <div><strong>Pass Marks:</strong> ${PORTAL_DATA.course.passMarks}</div>
                </div>
                <div class="exam-instructions">
                    Candidates are required to give their answers in their own words as far as practicable. The figures in the margin indicate full marks.
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <span style="font-size: 13.5px; color: var(--text-muted); font-weight: 600;">
                    Showing ${filteredQuestions.length} of ${yearData.questions.length} questions
                </span>
                <div style="display: flex; gap: 8px;">
                    <button id="expandAllBtn" class="btn-icon" style="font-size: 12px; padding: 5px 10px;">
                        <span>▼</span> Expand All Solutions
                    </button>
                    <button id="collapseAllBtn" class="btn-icon" style="font-size: 12px; padding: 5px 10px;">
                        <span>▲</span> Collapse All
                    </button>
                </div>
            </div>
        `;

        if (filteredQuestions.length === 0) {
            paperHtml += `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <h3>No questions match "${escapeHtml(searchQuery)}" in ${yearData.full_title}.</h3>
                    <p style="margin-top: 8px;">Try searching a broader keyword like "SQL", "2PL", "Normalization", or "ACID".</p>
                </div>
            `;
            examPaperEl.innerHTML = paperHtml;
            return;
        }

        // Split into Section A and Section B
        let currentSection = "";

        filteredQuestions.forEach((q, idx) => {
            if (q.section !== currentSection) {
                currentSection = q.section;
                const sectionSubtitle = currentSection === "Section A" 
                    ? "Attempt any TWO questions (Long Answers - 10 Marks each)" 
                    : "Attempt any EIGHT questions (Short Answers - 5 Marks each)";
                paperHtml += `
                    <div class="section-banner">
                        <span>${currentSection}</span>
                        <span style="font-size: 12px; font-weight: 500; opacity: 0.9;">${sectionSubtitle}</span>
                    </div>
                `;
            }

            paperHtml += `
                <div class="question-card" id="${q.id}">
                    <div class="question-header">
                        <div class="question-text">
                            <span class="question-num">${q.number}.</span>
                            ${highlightText(q.title, searchQuery)}
                        </div>
                        <div class="question-tags">
                            <span class="badge-marks">${q.marks} Marks</span>
                            <button class="btn-toggle-sol" onclick="toggleSolution('${q.id}')">
                                <span id="btn-text-${q.id}">Hide Solution</span>
                            </button>
                        </div>
                    </div>
                    <div class="solution-wrapper" id="sol-${q.id}" style="display: block;">
                        <div class="solution-header-bar">
                            <span class="sol-badge">Verified Solution</span>
                            <button class="btn-copy" onclick="copyQuestionText('${q.id}')">
                                📋 Copy Text
                            </button>
                        </div>
                        <div class="solution-body">
                            ${q.solution}
                        </div>
                    </div>
                </div>
            `;
        });

        examPaperEl.innerHTML = paperHtml;

        // Attach Expand/Collapse handlers
        document.getElementById('expandAllBtn').addEventListener('click', () => {
            document.querySelectorAll('.solution-wrapper').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.btn-toggle-sol span').forEach(el => el.innerText = 'Hide Solution');
        });
        document.getElementById('collapseAllBtn').addEventListener('click', () => {
            document.querySelectorAll('.solution-wrapper').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.btn-toggle-sol span').forEach(el => el.innerText = 'View Solution');
        });
    }

    // Toggle Single Solution
    window.toggleSolution = function(qId) {
        const solEl = document.getElementById(`sol-${qId}`);
        const btnText = document.getElementById(`btn-text-${qId}`);
        if (solEl.style.display === 'none') {
            solEl.style.display = 'block';
            if (btnText) btnText.innerText = 'Hide Solution';
        } else {
            solEl.style.display = 'none';
            if (btnText) btnText.innerText = 'View Solution';
        }
    };

    // Copy helper
    window.copyQuestionText = function(qId) {
        const card = document.getElementById(qId);
        if (!card) return;
        const text = card.innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert('Question & Solution copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    // Render Syllabus Tab
    function renderSyllabus() {
        const container = document.getElementById('syllabusContent');
        if (!container) return;

        let html = '<div class="syllabus-grid">';
        PORTAL_DATA.syllabus.forEach(u => {
            const badgeClass = u.priority.toLowerCase();
            html += `
                <div class="unit-card">
                    <div class="unit-card-header">
                        <div>
                            <div style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase;">
                                Unit ${u.unit} (${u.hours} Hours)
                            </div>
                            <h3 class="unit-card-title">${u.title}</h3>
                        </div>
                        <span class="unit-badge ${badgeClass}">${u.priority} Priority</span>
                    </div>
                    <ul class="topic-list">
                        ${u.topics.map(t => `<li class="topic-item">${t}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    // Render PYQ Matrix Tab
    function renderMatrix() {
        const container = document.getElementById('matrixContent');
        if (!container) return;

        let html = `
            <div class="matrix-container">
                <div class="matrix-header">
                    <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
                        Top 15 Ranked Past Paper Predictions & Recurrence Matrix
                    </h2>
                    <p style="font-size: 14px; color: var(--text-secondary);">
                        Derived from thorough empirical analysis of 8 TU BSc CSIT exam papers (2076–2082). Ranked by appearance frequency and question mark weight.
                    </p>
                </div>
                <div style="overflow-x: auto;">
                    <table class="matrix-table">
                        <thead>
                            <tr>
                                <th style="width: 50px;">Rank</th>
                                <th>Syllabus Topic</th>
                                <th>Unit</th>
                                <th>Recurrence</th>
                                <th>Exam Years</th>
                                <th>Format</th>
                                <th>Priority</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        PORTAL_DATA.pyqMatrix.forEach(item => {
            const pClass = item.priority.toLowerCase();
            html += `
                <tr>
                    <td style="font-weight: 800; color: var(--primary);">#${item.rank}</td>
                    <td>
                        <strong style="color: var(--text-primary);">${item.topic}</strong>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">${item.summary}</div>
                    </td>
                    <td>Unit ${item.unit}</td>
                    <td style="font-weight: 700; color: #0284c7;">${item.frequency}</td>
                    <td style="font-size: 12.5px; color: var(--text-secondary);">${item.years}</td>
                    <td><span class="badge-marks">${item.format}</span></td>
                    <td><span class="priority-pill ${pClass}">${item.priority}</span></td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    // Render Rapid Recall Tab
    function renderRecall() {
        const container = document.getElementById('recallContent');
        if (!container) return;

        let html = `
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
                    ⚡ High-Yield Rapid Recall Triggers
                </h2>
                <p style="font-size: 14px; color: var(--text-secondary);">
                    High-frequency definitions, differences, and core criteria designed for rapid exam revision.
                </p>
            </div>
            <div class="recall-grid">
        `;

        PORTAL_DATA.rapidRecall.forEach((item, idx) => {
            html += `
                <div class="recall-card">
                    <div style="font-size: 11px; font-weight: 800; color: var(--text-muted); margin-bottom: 4px;">TRIGGER #${idx + 1}</div>
                    <div class="recall-q">${item.q}</div>
                    <div class="recall-a">${item.a}</div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // Render Textbooks Tab
    function renderBooks() {
        const container = document.getElementById('booksContent');
        if (!container) return;

        let html = `
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
                    Prescribed Text Books & Reference Books
                </h2>
                <p style="font-size: 14px; color: var(--text-secondary);">
                    Official syllabus textbooks recommended by Tribhuvan University, IOST.
                </p>
            </div>
            <h3 style="margin: 20px 0 12px; font-size: 16px; color: var(--primary);">Primary Text Books</h3>
            <div class="book-grid">
        `;

        PORTAL_DATA.course.textBooks.forEach(b => {
            html += `
                <div class="book-card">
                    <div class="book-title">${b.title}</div>
                    <div class="book-meta"><strong>Edition:</strong> ${b.edition}</div>
                    <div class="book-meta"><strong>Authors:</strong> ${b.authors}</div>
                    <div class="book-meta"><strong>Publisher:</strong> ${b.publisher}</div>
                </div>
            `;
        });

        html += `
            </div>
            <h3 style="margin: 30px 0 12px; font-size: 16px; color: var(--primary);">Reference Books</h3>
            <div class="book-grid">
        `;

        PORTAL_DATA.course.referenceBooks.forEach(b => {
            html += `
                <div class="book-card">
                    <div class="book-title">${b.title}</div>
                    <div class="book-meta"><strong>Edition:</strong> ${b.edition}</div>
                    <div class="book-meta"><strong>Authors:</strong> ${b.authors}</div>
                    <div class="book-meta"><strong>Publisher:</strong> ${b.publisher}</div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // Render Practical & Viva Tab
    function renderPractical() {
        const container = document.getElementById('practicalContent');
        if (!container) return;

        container.innerHTML = `
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 24px;">
                <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 10px;">
                    Laboratory Work Guidelines (Full Marks: 20, Pass Marks: 8)
                </h2>
                <p style="font-size: 14.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
                    The laboratory work includes writing database programs to create and query databases using basic and advanced features of Structured Query Language (SQL).
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    <div style="background: var(--bg-subtle); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        <h4 style="color: var(--primary); margin-bottom: 8px;">1. DDL & Integrity Constraints</h4>
                        <p style="font-size: 13.5px; color: var(--text-secondary);">Creating databases and tables with PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE, and CHECK constraints. Modifying schemas using ALTER TABLE.</p>
                    </div>
                    <div style="background: var(--bg-subtle); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        <h4 style="color: var(--primary); margin-bottom: 8px;">2. DML Operations & Queries</h4>
                        <p style="font-size: 13.5px; color: var(--text-secondary);">Populating tables with INSERT; updating records with UPDATE and DELETE; querying data with SELECT, WHERE, ORDER BY, and LIKE.</p>
                    </div>
                    <div style="background: var(--bg-subtle); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        <h4 style="color: var(--primary); margin-bottom: 8px;">3. Multi-table Joins & Subqueries</h4>
                        <p style="font-size: 13.5px; color: var(--text-secondary);">Inner Joins, Left/Right Outer Joins, Natural Joins, correlated subqueries, and set operations (UNION, INTERSECT, EXCEPT).</p>
                    </div>
                    <div style="background: var(--bg-subtle); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        <h4 style="color: var(--primary); margin-bottom: 8px;">4. Aggregation & Views</h4>
                        <p style="font-size: 13.5px; color: var(--text-secondary);">Using GROUP BY, HAVING, and aggregate functions (COUNT, SUM, AVG, MIN, MAX); creating and managing SQL Views and Triggers.</p>
                    </div>
                </div>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; box-shadow: var(--shadow-sm);">
                <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 14px;">
                    Common DBMS Viva Voce Questions & Quick Answers
                </h3>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="border-left: 3px solid var(--primary); padding-left: 14px;">
                        <strong style="color: var(--text-primary); font-size: 14.5px;">Q1: What is the difference between DELETE, TRUNCATE, and DROP?</strong>
                        <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 4px;"><strong>DELETE</strong> is a DML statement that removes rows conditionally and can be rolled back. <strong>TRUNCATE</strong> is a DDL statement that deallocates entire table data quickly without row-by-row logging. <strong>DROP</strong> removes table data and schema permanently from database catalog.</p>
                    </div>
                    <div style="border-left: 3px solid var(--primary); padding-left: 14px;">
                        <strong style="color: var(--text-primary); font-size: 14.5px;">Q2: What is a Foreign Key and why is ON DELETE CASCADE used?</strong>
                        <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 4px;">A Foreign Key enforces referential integrity by linking a child column to a parent primary key. <code>ON DELETE CASCADE</code> automatically deletes matching referencing rows in child table when a referenced parent row is deleted, avoiding dangling pointers.</p>
                    </div>
                    <div style="border-left: 3px solid var(--primary); padding-left: 14px;">
                        <strong style="color: var(--text-primary); font-size: 14.5px;">Q3: Why is 3NF preferred over BCNF in industry database designs?</strong>
                        <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 4px;">3NF always guarantees dependency preservation along with lossless decomposition, whereas BCNF may not always preserve all functional dependencies when decomposing relations.</p>
                    </div>
                    <div style="border-left: 3px solid var(--primary); padding-left: 14px;">
                        <strong style="color: var(--text-primary); font-size: 14.5px;">Q4: What is the Write-Ahead Logging (WAL) protocol?</strong>
                        <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 4px;">WAL dictates that the log record representing a change must be written to non-volatile disk storage before the corresponding data page is written to database disk storage, ensuring recoverability.</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Render Chapters Tab
    function renderChapters() {
        const container = document.getElementById('chaptersContent');
        if (!container) return;

        let html = `
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
                    Chapter-by-Chapter Core Concepts & Exam Focus
                </h2>
                <p style="font-size: 14px; color: var(--text-secondary);">
                    Direct study points and essential theory summaries for each syllabus chapter.
                </p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 18px;">
        `;

        const chapterSummaries = [
            {
                unit: 1,
                title: "Database and Database Users",
                summary: "Focus on 4 characteristics of database approach vs file system: self-describing catalog, data abstraction, multiple views, and multi-user concurrency. Know roles of DBA vs End Users."
            },
            {
                unit: 2,
                title: "Database System Concepts and Architecture",
                summary: "Master ANSI/SPARC 3-Schema Architecture (External, Conceptual, Internal). Explain Logical Data Independence (changing conceptual schema without altering views) and Physical Data Independence (changing storage indexing without altering conceptual schema)."
            },
            {
                unit: 3,
                title: "Data Modeling Using Entity-Relational Model",
                summary: "Know ER symbols, composite vs multivalued attributes, weak entities (double rectangle & double diamond), cardinality ratios (1:1, 1:N, M:N), and specialization disjointness (d vs o) and completeness (total vs partial)."
            },
            {
                unit: 4,
                title: "Relational Model & Constraints",
                summary: "Understand Domain constraints, Key constraints, Entity Integrity (PK cannot be NULL), and Referential Integrity (foreign key references valid parent PK or NULL)."
            },
            {
                unit: 5,
                title: "Relational Algebra and Calculus",
                summary: "Master Select (σ), Project (π), Natural Join (⋈), Union (∪), Intersection (∩), Set Difference (−), Cartesian Product (×), and Division (÷). Know TRC formulas with quantifiers (∃, ∀)."
            },
            {
                unit: 6,
                title: "SQL",
                summary: "Be ready to write DDL (CREATE TABLE with foreign key references) and complex DML queries involving JOINs, GROUP BY, HAVING, and aggregate functions on Banking or Library schemas."
            },
            {
                unit: 7,
                title: "Relational Database Design & Normalization",
                summary: "Understand 4 informal design guidelines (semantics, redundancy, NULLs, spurious tuples). Memorize definitions and examples of 1NF (atomic values), 2NF (no partial dependency), 3NF (no transitive dependency), and BCNF (LHS must be superkey)."
            },
            {
                unit: 8,
                title: "Transaction Processing Concepts",
                summary: "ACID properties (Atomicity, Consistency, Isolation, Durability) and Transaction states. Conflict serializability testing using precedence graphs and recoverability classifications."
            },
            {
                unit: 9,
                title: "Concurrency Control Techniques",
                summary: "Two-Phase Locking (Growing and Shrinking phase, Strict vs Rigorous 2PL), Deadlock prevention (Wait-Die vs Wound-Wait), and Timestamp Ordering."
            },
            {
                unit: 10,
                title: "Database Recovery Techniques",
                summary: "Immediate Update (UNDO/REDO algorithm with WAL) vs Deferred Update (NO-UNDO/REDO), Checkpointing mechanism, and Shadow Paging."
            }
        ];

        chapterSummaries.forEach(c => {
            html += `
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; box-shadow: var(--shadow-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h3 style="font-size: 16px; font-weight: 700; color: var(--primary);">Unit ${c.unit}: ${c.title}</h3>
                        <button class="btn-icon" style="font-size: 12px; padding: 4px 10px;" onclick="searchTopic('${c.title}')">
                            🔍 View Past Questions
                        </button>
                    </div>
                    <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">${c.summary}</p>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    window.searchTopic = function(topic) {
        searchInput.value = topic.split(' ')[0];
        searchQuery = searchInput.value;
        switchTab('question-banks');
        renderExamPaper();
    };

    // Global Search Event
    let searchDebounce;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            searchQuery = e.target.value.trim();
            if (currentTab !== 'question-banks') {
                switchTab('question-banks');
            }
            renderExamPaper();
        }, 200);
    });

    // Helper functions
    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function highlightText(text, query) {
        if (!query || query.trim() === '') return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<mark style="background: #fde047; color: #854d0e; padding: 1px 4px; border-radius: 3px;">$1</mark>');
    }

    // Initial Render of All Tabs
    renderYearSidebar();
    renderExamPaper();
    renderSyllabus();
    renderMatrix();
    renderRecall();
    renderChapters();
    renderBooks();
    renderPractical();
});
