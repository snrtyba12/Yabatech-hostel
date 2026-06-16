// Admin page
   function showStep(step){

    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "none";
    document.getElementById("step3").style.display = "none";

    document.getElementById("step" + step).style.display = "block";

    document.querySelectorAll(".step").forEach((el, i) => {
        el.classList.toggle("active", i + 1 === step);
         })
    
        }

        const menubar = document.getElementById("menubar");
        const menu = document.getElementById("menu");
        menubar.addEventlistener("click",()=>{
            menu.classList.toggle("active");
        });

     // ── PAGE NAVIGATION ──────────────────────────────
  const pageTitles = {
    dashboard:     ['Dashboard',     'Welcome back, Mr. Emeka. Here\'s what\'s happening today.'],
    applications:  ['Applications',  'Review and manage all room booking requests.'],
    rooms:         ['Rooms',         'Manage room types, availability and pricing.'],
    residents:     ['Residents',     'View and manage all current hostel residents.'],
    messages:      ['Messages',      'Read and reply to contact form submissions.'],
    announcements: ['Announcements', 'Post and manage notices to all residents.'],
    payments:      ['Payments',      'Track all room fee payments and outstanding balances.'],
    settings:      ['Settings',      'Update hostel information and admin account.'],
  };

  function showPage(page, linkEl) {
    // hide all pages
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    // show target
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    // update title
    if (pageTitles[page]) {
      document.getElementById('page-title').textContent = pageTitles[page][0];
      document.getElementById('page-sub').textContent   = pageTitles[page][1];
    }
    // update sidebar active link
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    if (linkEl) linkEl.classList.add('active');
    // close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
    return false;
  }

  // ── STATUS UPDATE ────────────────────────────────
  function updateStatus(btn, status) {
    const td = btn.closest('td');
    const statusCell = btn.closest('tr').querySelector('.badge');
    if (statusCell) {
      statusCell.className = 'badge ' + (status === 'Confirmed' ? 'badge-confirmed' : 'badge-rejected');
      statusCell.textContent = status;
    }
    td.innerHTML = '<button class="act-btn act-view">View</button>';
  }

  // ── MOBILE SIDEBAR ───────────────────────────────
  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger-btn');
    if (window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        !hamburger.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
  





//   document.getElementById("sidebarToggle").addEventListener("click", () => {
//     document.querySelector(".sidebar").classList.toggle("open");
// });
// const menuBtn = document.getElementById("sidebarToggle");
// const sidebar = document.getElementById("sidebar");

// menuBtn.addEventListener("click", () => {
//     sidebar.classList.toggle("open");
// });
const menuBtn = document.getElementById("sidebarToggle");

menuBtn.addEventListener("click", () => {
    alert("Button clicked!");
});
  





// Students login page
   function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('panel-' + tab).classList.add('active');
  }

  function togglePw(id, btn) {
    const input = document.getElementById(id);
    const icon  = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fa-solid fa-eye';
    }
  }

  function checkStrength(input) {
    const val  = input.value;
    const fill = document.getElementById('strengthFill');
    const text = document.getElementById('strengthText');
    let score  = 0;
    if (val.length >= 6)               score++;
    if (val.length >= 10)              score++;
    if (/[A-Z]/.test(val))            score++;
    if (/[0-9]/.test(val))            score++;
    if (/[^A-Za-z0-9]/.test(val))     score++;

    const levels = [
      { w: '0%',   bg: '#e5e7eb', label: 'Enter a password' },
      { w: '25%',  bg: '#ef4444', label: 'Weak' },
      { w: '50%',  bg: '#f59e0b', label: 'Fair' },
      { w: '75%',  bg: '#3b82f6', label: 'Good' },
      { w: '100%', bg: '#22c55e', label: 'Strong ✓' },
    ];
    const lvl = levels[Math.min(score, 4)];
    fill.style.width      = lvl.w;
    fill.style.background = lvl.bg;
    text.textContent      = lvl.label;
    text.style.color      = lvl.bg;
  }

  function checkUsername(input) {
    input.value = input.value.replace(/\s/g, '_').toLowerCase();
  }

  function handleLogin() {
    const id  = document.getElementById('loginIdentifier').value.trim();
    const pw  = document.getElementById('loginPassword').value.trim();
    const btn = document.getElementById('loginBtn');
    let valid = true;

    document.getElementById('loginIdentifierError').style.display = 'none';
    document.getElementById('loginPasswordError').style.display   = 'none';
    document.getElementById('loginError').classList.remove('show');

    if (!id) { document.getElementById('loginIdentifierError').style.display = 'block'; valid = false; }
    if (!pw) { document.getElementById('loginPasswordError').style.display   = 'block'; valid = false; }
    if (!valid) return;

    btn.classList.add('loading');
    btn.textContent = 'Signing in…';

    // Replace with real fetch('/api/student/login')
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
  }

  function handleRegister() {
    const fields = [
      { id: 'reg-fname',    err: 'err-fname',    check: v => v.length > 0 },
      { id: 'reg-lname',    err: 'err-lname',    check: v => v.length > 0 },
      { id: 'reg-username', err: 'err-username', check: v => v.length > 2 },
      { id: 'reg-matric',   err: 'err-matric',   check: v => v.length > 3 },
      { id: 'reg-level',    err: 'err-level',    check: v => v !== '' },
      { id: 'reg-gender',   err: 'err-gender',   check: v => v !== '' },
      { id: 'reg-email',    err: 'err-email',    check: v => v.includes('@') },
      { id: 'reg-phone',    err: 'err-phone',    check: v => v.length > 6 },
      { id: 'reg-password', err: 'err-password', check: v => v.length >= 6 },
    ];

    let valid = true;
    fields.forEach(f => document.getElementById(f.err).style.display = 'none');
    document.getElementById('err-confirm').style.display = 'none';
    document.getElementById('err-terms').style.display   = 'none';
    document.getElementById('registerError').classList.remove('show');

    fields.forEach(f => {
      const val = document.getElementById(f.id).value.trim();
      if (!f.check(val)) {
        document.getElementById(f.err).style.display = 'block';
        valid = false;
      }
    });

    const pw1 = document.getElementById('reg-password').value;
    const pw2 = document.getElementById('reg-confirm').value;
    if (pw1 !== pw2 || pw2 === '') {
      document.getElementById('err-confirm').style.display = 'block';
      valid = false;
    }

    if (!document.getElementById('reg-terms').checked) {
      document.getElementById('err-terms').style.display = 'block';
      valid = false;
    }

    if (!valid) {
      document.getElementById('registerError').classList.add('show');
      return;
    }

    const btn = document.getElementById('registerBtn');
    btn.classList.add('loading');
    btn.textContent = 'Creating account…';

    // Replace with real fetch('/api/student/register')
    setTimeout(() => {
      document.getElementById('registerForm').style.display = 'none';
      document.getElementById('registerSuccess').classList.add('show');
    }, 1400);
  }

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const loginActive = document.getElementById('panel-login').classList.contains('active');
    if (loginActive) handleLogin(); else handleRegister();
  });




  
// Admin login page
  function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon  = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fa-solid fa-eye';
    }
  }

  function handleAdminLogin() {
    const email    = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    const btn      = document.getElementById('loginBtn');
    let valid = true;

    // clear previous errors
    document.getElementById('emailError').style.display    = 'none';
    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('errorBanner').classList.remove('show');

    if (!email || !email.includes('@')) {
      document.getElementById('emailError').style.display = 'block';
      valid = false;
    }
    if (!password) {
      document.getElementById('passwordError').style.display = 'block';
      valid = false;
    }
    if (!valid) return;

    // Loading state
    btn.classList.add('loading');
    btn.textContent = 'Signing in…';

    // Simulate login check (replace with real fetch to /api/admin/login)
    setTimeout(() => {
      // Demo credentials: admin@greenleafhostel.ng / admin123
      if (email === 'admin@greenleafhostel.ng' && password === 'admin123') {
        window.location.href = 'admin.html';
      } else {
        document.getElementById('errorBanner').classList.add('show');
        btn.classList.remove('loading');
        btn.textContent = 'Sign In to Dashboard';
      }
    }, 1200);
  }

  // submit on Enter key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdminLogin();
  });


  