// إعدادات التطبيق والمتغيرات العامة
let students = JSON.parse(localStorage.getItem('students')) || [];
let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
let nextStudentId = parseInt(localStorage.getItem('nextStudentId')) || 1;
let nextAssignmentId = parseInt(localStorage.getItem('nextAssignmentId')) || 1;

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// تهيئة التطبيق
function initializeApp() {
    setupTabNavigation();
    setupForms();
    loadStudentsTable();
    loadAssignmentsTable();
    loadStudentSelect();
    updateStats();
    updateReports();
    setDefaultDates();
}

// إعداد التنقل بين التبويبات
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // إزالة الفئة النشطة من جميع الأزرار والمحتويات
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // إضافة الفئة النشطة للزر والمحتوى المحدد
            button.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
            
            // تحديث البيانات للتبويب المختار
            if (tabName === 'reports') {
                updateReports();
            }
        });
    });
}

// إعداد النماذج
function setupForms() {
    // نموذج تسجيل الطلاب
    document.getElementById('studentForm').addEventListener('submit', handleStudentSubmission);
    
    // نموذج الواجبات
    document.getElementById('assignmentForm').addEventListener('submit', handleAssignmentSubmission);
}

// تعيين التواريخ الافتراضية
function setDefaultDates() {
    const today = new Date();
    const joinDateInput = document.getElementById('joinDate');
    const dueDateInput = document.getElementById('dueDate');
    
    // تعيين تاريخ اليوم كتاريخ انضمام افتراضي
    joinDateInput.value = today.toISOString().split('T')[0];
    
    // تعيين تاريخ بعد أسبوع كتاريخ تسليم افتراضي
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    dueDateInput.value = nextWeek.toISOString().split('T')[0];
}

// معالج إرسال نموذج الطلاب
function handleStudentSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const isEditMode = form.dataset.editMode === 'true';
    const editId = parseInt(form.dataset.editId);
    
    if (isEditMode) {
        // وضع التعديل
        const student = students.find(s => s.id === editId);
        if (!student) return;
        
        student.name = document.getElementById('studentName').value.trim();
        student.age = parseInt(document.getElementById('studentAge').value);
        student.parentName = document.getElementById('parentName').value.trim();
        student.parentPhone = document.getElementById('parentPhone').value.trim();
        student.level = document.getElementById('currentLevel').value;
        student.joinDate = document.getElementById('joinDate').value;
        
        if (!validateStudentData(student)) {
            return;
        }
        
        saveData();
        loadStudentsTable();
        loadStudentSelect();
        loadAssignmentsTable(); // تحديث أسماء الطلاب في الواجبات
        
        // إعادة تعيين وضع النموذج
        resetStudentForm();
        
        showNotification('تم تحديث بيانات الطالب بنجاح!', 'success');
    } else {
        // وضع الإضافة
        const formData = {
            id: nextStudentId++,
            academicCode: generateAcademicCode(),
            name: document.getElementById('studentName').value.trim(),
            age: parseInt(document.getElementById('studentAge').value),
            parentName: document.getElementById('parentName').value.trim(),
            parentPhone: document.getElementById('parentPhone').value.trim(),
            level: document.getElementById('currentLevel').value,
            joinDate: document.getElementById('joinDate').value,
            registrationDate: new Date().toISOString().split('T')[0]
        };
        
        if (!validateStudentData(formData)) {
            return;
        }
        
        students.push(formData);
        saveData();
        loadStudentsTable();
        loadStudentSelect();
        updateStats();
        
        form.reset();
        setDefaultDates();
        
        showNotification('تم تسجيل الطالب بنجاح!', 'success');
    }
}

// إعادة تعيين نموذج الطالب
function resetStudentForm() {
    const form = document.getElementById('studentForm');
    form.reset();
    setDefaultDates();
    delete form.dataset.editMode;
    delete form.dataset.editId;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> تسجيل الطالب';
    submitBtn.classList.add('btn-primary');
    submitBtn.classList.remove('btn-warning');
    
    // إخفاء زر الإلغاء
    document.getElementById('cancelEditStudent').style.display = 'none';
}

// معالج إرسال نموذج الواجبات
function handleAssignmentSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const isEditMode = form.dataset.editMode === 'true';
    const editId = parseInt(form.dataset.editId);
    
    const studentId = parseInt(document.getElementById('studentSelect').value);
    const student = students.find(s => s.id === studentId);
    
    if (isEditMode) {
        // وضع التعديل
        const assignment = assignments.find(a => a.id === editId);
        if (!assignment) return;
        
        assignment.studentId = studentId;
        assignment.studentName = student.name;
        assignment.type = document.getElementById('assignmentType').value;
        assignment.content = document.getElementById('assignmentContent').value.trim();
        assignment.dueDate = document.getElementById('dueDate').value;
        assignment.weeklyDays = parseInt(document.getElementById('weeklyDays').value);
        assignment.estimatedDuration = parseInt(document.getElementById('estimatedDuration').value);
        assignment.priority = document.getElementById('priority').value;
        
        if (!validateAssignmentData(assignment)) {
            return;
        }
        
        saveData();
        loadAssignmentsTable();
        updateStats();
        
        // إعادة تعيين وضع النموذج
        resetAssignmentForm();
        
        showNotification('تم تحديث بيانات الواجب بنجاح!', 'success');
    } else {
        // وضع الإضافة
        const formData = {
            id: nextAssignmentId++,
            studentId: studentId,
            studentName: student.name,
            type: document.getElementById('assignmentType').value,
            content: document.getElementById('assignmentContent').value.trim(),
            dueDate: document.getElementById('dueDate').value,
            weeklyDays: parseInt(document.getElementById('weeklyDays').value),
            estimatedDuration: parseInt(document.getElementById('estimatedDuration').value),
            priority: document.getElementById('priority').value,
            status: 'معلق',
            assignDate: new Date().toISOString().split('T')[0]
        };
        
        if (!validateAssignmentData(formData)) {
            return;
        }
        
        assignments.push(formData);
        saveData();
        loadAssignmentsTable();
        updateStats();
        
        form.reset();
        setDefaultDates();
        
        showNotification('تم إضافة الواجب بنجاح!', 'success');
    }
}

// إعادة تعيين نموذج الواجب
function resetAssignmentForm() {
    const form = document.getElementById('assignmentForm');
    form.reset();
    setDefaultDates();
    delete form.dataset.editMode;
    delete form.dataset.editId;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> إضافة الواجب';
    submitBtn.classList.add('btn-primary');
    submitBtn.classList.remove('btn-warning');
    
    // إخفاء زر الإلغاء
    document.getElementById('cancelEditAssignment').style.display = 'none';
}

// توليد كود أكاديمي تلقائي
function generateAcademicCode() {
    const currentYear = new Date().getFullYear();
    const code = `QM${currentYear}${String(nextStudentId).padStart(4, '0')}`;
    return code;
}

// التحقق من صحة بيانات الطالب
function validateStudentData(data) {
    if (!data.name || data.name.length < 2) {
        showNotification('يرجى إدخال اسم صحيح للطالب', 'error');
        return false;
    }
    
    if (data.age < 5 || data.age > 80) {
        showNotification('يرجى إدخال عمر صحيح (5-80 سنة)', 'error');
        return false;
    }
    
    if (!data.parentName || data.parentName.length < 2) {
        showNotification('يرجى إدخال اسم صحيح لولي الأمر', 'error');
        return false;
    }
    
    if (!data.parentPhone || data.parentPhone.length < 10) {
        showNotification('يرجى إدخال رقم هاتف صحيح', 'error');
        return false;
    }
    
    return true;
}

// التحقق من صحة بيانات الواجب
function validateAssignmentData(data) {
    if (!data.studentId) {
        showNotification('يرجى اختيار طالب', 'error');
        return false;
    }
    
    if (!data.type) {
        showNotification('يرجى اختيار نوع الواجب', 'error');
        return false;
    }
    
    if (!data.content || data.content.length < 5) {
        showNotification('يرجى إدخال وصف مفصل للواجب', 'error');
        return false;
    }
    
    if (!data.dueDate) {
        showNotification('يرجى تحديد تاريخ التسليم', 'error');
        return false;
    }
    
    return true;
}

// تحميل جدول الطلاب
function loadStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';
    
    students.forEach(student => {
        const row = createStudentRow(student);
        tbody.appendChild(row);
    });
}

// وظيفة البحث في الطلاب
function searchStudents() {
    const searchTerm = document.getElementById('searchStudents').value.toLowerCase();
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';
    
    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        student.academicCode.toLowerCase().includes(searchTerm) ||
        student.parentName.toLowerCase().includes(searchTerm) ||
        student.parentPhone.includes(searchTerm) ||
        student.level.toLowerCase().includes(searchTerm)
    );
    
    filteredStudents.forEach(student => {
        const row = createStudentRow(student);
        tbody.appendChild(row);
    });
    
    if (filteredStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #7f8c8d;">لا توجد نتائج</td></tr>';
    }
}

// إنشاء صف في جدول الطلاب
function createStudentRow(student) {
    const row = document.createElement('tr');
    row.className = 'fade-in';
    
    row.innerHTML = `
        <td><strong>${student.academicCode}</strong></td>
        <td>${student.name}</td>
        <td>${student.age} سنة</td>
        <td>${student.parentName}</td>
        <td>${student.parentPhone}</td>
        <td><span class="status-badge status-pending">${student.level}</span></td>
        <td>${formatDate(student.joinDate)}</td>
        <td>
            <div class="action-buttons">
                <button class="action-btn edit" onclick="editStudent(${student.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteStudent(${student.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="action-btn complete" onclick="printStudentCard(${student.id})" title="طباعة البطاقة">
                    <i class="fas fa-print"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// تحميل جدول الواجبات
function loadAssignmentsTable() {
    const tbody = document.getElementById('assignmentsTableBody');
    tbody.innerHTML = '';
    
    assignments.forEach(assignment => {
        const row = createAssignmentRow(assignment);
        tbody.appendChild(row);
    });
}

// وظيفة التصفية والبحث في الواجبات
function filterAssignments() {
    const searchTerm = document.getElementById('searchAssignments').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const tbody = document.getElementById('assignmentsTableBody');
    tbody.innerHTML = '';
    
    let filteredAssignments = assignments;
    
    // تصفية حسب الحالة
    if (statusFilter !== 'all') {
        filteredAssignments = filteredAssignments.filter(a => a.status === statusFilter);
    }
    
    // تصفية حسب البحث
    if (searchTerm) {
        filteredAssignments = filteredAssignments.filter(assignment => 
            assignment.studentName.toLowerCase().includes(searchTerm) ||
            assignment.content.toLowerCase().includes(searchTerm) ||
            assignment.type.toLowerCase().includes(searchTerm) ||
            assignment.id.toString().includes(searchTerm)
        );
    }
    
    filteredAssignments.forEach(assignment => {
        const row = createAssignmentRow(assignment);
        tbody.appendChild(row);
    });
    
    if (filteredAssignments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #7f8c8d;">لا توجد نتائج</td></tr>';
    }
}

// إنشاء صف في جدول الواجبات
function createAssignmentRow(assignment) {
    const row = document.createElement('tr');
    row.className = 'fade-in';
    
    const statusClass = getStatusClass(assignment.status);
    const priorityClass = getPriorityClass(assignment.priority);
    
    row.innerHTML = `
        <td><strong>#${assignment.id}</strong></td>
        <td>${assignment.studentName}</td>
        <td>${assignment.type}</td>
        <td>${assignment.content}</td>
        <td>${formatDate(assignment.dueDate)}</td>
        <td>${assignment.weeklyDays} أيام</td>
        <td>${assignment.estimatedDuration} يوم</td>
        <td><span class="priority-badge ${priorityClass}">${assignment.priority}</span></td>
        <td><span class="status-badge ${statusClass}">${assignment.status}</span></td>
        <td>
            <div class="action-buttons">
                ${assignment.status === 'معلق' ? `
                    <button class="action-btn complete" onclick="completeAssignment(${assignment.id})" title="إكمال">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                <button class="action-btn edit" onclick="editAssignment(${assignment.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteAssignment(${assignment.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// تحميل قائمة الطلاب في نموذج الواجبات
function loadStudentSelect() {
    const select = document.getElementById('studentSelect');
    select.innerHTML = '<option value="">اختر طالب</option>';
    
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (${student.academicCode})`;
        select.appendChild(option);
    });
}

// تحديث الإحصائيات
function updateStats() {
    const totalStudents = students.length;
    const totalAssignments = assignments.length;
    
    // تحديث الإحصائيات في الرأس
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('totalTasks').textContent = totalAssignments;
}

// تحديث التقارير
function updateReports() {
    const totalStudents = students.length;
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === 'مكتمل').length;
    const pendingAssignments = assignments.filter(a => a.status === 'معلق').length;
    
    document.getElementById('reportTotalStudents').textContent = totalStudents;
    document.getElementById('reportTotalAssignments').textContent = totalAssignments;
    document.getElementById('reportCompletedAssignments').textContent = completedAssignments;
    document.getElementById('reportPendingAssignments').textContent = pendingAssignments;
    
    loadTopStudents();
}

// تحميل جدول الطلاب المتميزين
function loadTopStudents() {
    const tbody = document.getElementById('topStudentsTableBody');
    tbody.innerHTML = '';
    
    // حساب إحصائيات كل طالب
    const studentStats = students.map(student => {
        const studentAssignments = assignments.filter(a => a.studentId === student.id);
        const completedAssignments = studentAssignments.filter(a => a.status === 'مكتمل').length;
        const completionRate = studentAssignments.length > 0 ? 
            Math.round((completedAssignments / studentAssignments.length) * 100) : 0;
        
        return {
            ...student,
            completedAssignments,
            totalAssignments: studentAssignments.length,
            completionRate
        };
    });
    
    // ترتيب الطلاب حسب عدد الواجبات المكتملة ونسبة الإنجاز
    studentStats.sort((a, b) => {
        if (b.completedAssignments !== a.completedAssignments) {
            return b.completedAssignments - a.completedAssignments;
        }
        return b.completionRate - a.completionRate;
    });
    
    // عرض أفضل 10 طلاب
    studentStats.slice(0, 10).forEach((student, index) => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        
        row.innerHTML = `
            <td><strong>#${index + 1}</strong></td>
            <td>${student.name}</td>
            <td>${student.completedAssignments}</td>
            <td>${student.completionRate}%</td>
            <td><span class="status-badge status-pending">${student.level}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// حذف طالب
function deleteStudent(id) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع واجباته أيضاً.')) {
        students = students.filter(s => s.id !== id);
        assignments = assignments.filter(a => a.studentId !== id);
        saveData();
        loadStudentsTable();
        loadStudentSelect();
        loadAssignmentsTable();
        updateStats();
        showNotification('تم حذف الطالب بنجاح!', 'success');
    }
}

// حذف واجب
function deleteAssignment(id) {
    if (confirm('هل أنت متأكد من حذف هذا الواجب؟')) {
        assignments = assignments.filter(a => a.id !== id);
        saveData();
        loadAssignmentsTable();
        updateStats();
        showNotification('تم حذف الواجب بنجاح!', 'success');
    }
}

// إكمال واجب
function completeAssignment(id) {
    const assignment = assignments.find(a => a.id === id);
    if (assignment) {
        assignment.status = 'مكتمل';
        assignment.completionDate = new Date().toISOString().split('T')[0];
        saveData();
        loadAssignmentsTable();
        updateStats();
        showNotification('تم إكمال الواجب بنجاح!', 'success');
    }
}

// طباعة قائمة الطلاب
function printStudentsList() {
    const printWindow = window.open('', '_blank');
    const studentsHtml = generateStudentsListHTML();
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>قائمة الطلاب - دار تحفيظ القرآن</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                @media print {
                    @page { size: A4; margin: 15mm; }
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Cairo', 'Arial', sans-serif; 
                    direction: rtl; 
                    text-align: right;
                    background: linear-gradient(135deg, #f5f7fa 0%, #e8eef3 100%);
                    padding: 20px;
                    color: #2c3e50;
                }
                .container {
                    max-width: 900px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
                    color: white;
                    border-radius: 10px;
                }
                .header-icon {
                    font-size: 3rem;
                    margin-bottom: 10px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                }
                .header h1 { 
                    font-size: 2rem;
                    margin-bottom: 10px;
                    font-weight: 700;
                }
                .header p { 
                    color: #ecf0f1;
                    font-size: 1.1rem;
                    font-weight: 500;
                }
                .stats-bar {
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 25px;
                    padding: 20px;
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    border-radius: 10px;
                    color: white;
                }
                .stat-item {
                    text-align: center;
                }
                .stat-number {
                    font-size: 2rem;
                    font-weight: 700;
                    display: block;
                    margin-bottom: 5px;
                }
                .stat-label {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    border-radius: 8px;
                    overflow: hidden;
                }
                th { 
                    background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
                    color: white;
                    padding: 15px 12px;
                    font-weight: 600;
                    text-align: right;
                    font-size: 0.95rem;
                    border-bottom: 3px solid #3498db;
                }
                td { 
                    border: 1px solid #ecf0f1;
                    padding: 12px;
                    text-align: right;
                    font-size: 0.9rem;
                }
                tbody tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                tbody tr:hover {
                    background-color: #e3f2fd;
                    transition: background-color 0.2s ease;
                }
                .level-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .level-مبتدئ { background: #e3f2fd; color: #1976d2; }
                .level-متوسط { background: #fff3e0; color: #f57c00; }
                .level-متقدم { background: #f3e5f5; color: #7b1fa2; }
                .level-حافظ { background: #e8f5e9; color: #2e7d32; }
                .footer { 
                    margin-top: 30px;
                    padding-top: 20px;
                    text-align: center;
                    color: #7f8c8d;
                    border-top: 2px solid #ecf0f1;
                    font-size: 0.9rem;
                }
                .footer-icon {
                    font-size: 1.2rem;
                    margin: 0 5px;
                    vertical-align: middle;
                }
                @media print {
                    body { background: white; padding: 0; }
                    .container { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="header-icon">🕌</div>
                    <h1>دار تحفيظ القرآن الكريم</h1>
                    <p>📊 قائمة الطلاب المسجلين</p>
                </div>
                
                <div class="stats-bar">
                    <div class="stat-item">
                        <span class="stat-number">${students.length}</span>
                        <span class="stat-label">👥 إجمالي الطلاب</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${formatDate(new Date().toISOString().split('T')[0])}</span>
                        <span class="stat-label">📅 تاريخ الطباعة</span>
                    </div>
                </div>
                
                ${studentsHtml}
                
                <div class="footer">
                    <p><span class="footer-icon">⌛</span> تم الطباعة في: ${new Date().toLocaleString('ar-SA')}</p>
                    <p style="margin-top: 10px; font-size: 0.85rem; color: #95a5a6;">🕋 بارك الله فيكم</p>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
}

// طباعة قائمة الواجبات
function printAssignmentsList() {
    const printWindow = window.open('', '_blank');
    const assignmentsHtml = generateAssignmentsListHTML();
    const completed = assignments.filter(a => a.status === 'مكتمل').length;
    const pending = assignments.filter(a => a.status === 'معلق').length;
    const overdue = assignments.filter(a => a.status === 'متأخر').length;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>قائمة الواجبات - دار تحفيظ القرآن</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                @media print {
                    @page { size: A4 landscape; margin: 15mm; }
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Cairo', 'Arial', sans-serif; 
                    direction: rtl; 
                    text-align: right;
                    background: linear-gradient(135deg, #f5f7fa 0%, #e8eef3 100%);
                    padding: 20px;
                    color: #2c3e50;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
                    color: white;
                    border-radius: 10px;
                }
                .header-icon {
                    font-size: 3rem;
                    margin-bottom: 10px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                }
                .header h1 { 
                    font-size: 2rem;
                    margin-bottom: 10px;
                    font-weight: 700;
                }
                .header p { 
                    color: #ecf0f1;
                    font-size: 1.1rem;
                    font-weight: 500;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .stat-card {
                    padding: 15px;
                    border-radius: 10px;
                    text-align: center;
                    color: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .stat-card.total { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); }
                .stat-card.completed { background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); }
                .stat-card.pending { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); }
                .stat-card.overdue { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); }
                .stat-number {
                    font-size: 2rem;
                    font-weight: 700;
                    display: block;
                    margin-bottom: 5px;
                }
                .stat-label {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px;
                    font-size: 11px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    border-radius: 8px;
                    overflow: hidden;
                }
                th { 
                    background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
                    color: white;
                    padding: 12px 8px;
                    font-weight: 600;
                    text-align: right;
                    font-size: 0.85rem;
                    border-bottom: 3px solid #9b59b6;
                }
                td { 
                    border: 1px solid #ecf0f1;
                    padding: 10px 8px;
                    text-align: right;
                }
                tbody tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                tbody tr:hover {
                    background-color: #e3f2fd;
                    transition: background-color 0.2s ease;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .status-مكتمل { background: #d4edda; color: #155724; }
                .status-معلق { background: #fff3cd; color: #856404; }
                .status-متأخر { background: #f8d7da; color: #721c24; }
                .priority-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .priority-عادي { background: #e3f2fd; color: #1976d2; }
                .priority-مهم { background: #fff3e0; color: #f57c00; }
                .priority-عاجل { background: #ffebee; color: #d32f2f; }
                .footer { 
                    margin-top: 30px;
                    padding-top: 20px;
                    text-align: center;
                    color: #7f8c8d;
                    border-top: 2px solid #ecf0f1;
                    font-size: 0.9rem;
                }
                .footer-icon {
                    font-size: 1.2rem;
                    margin: 0 5px;
                    vertical-align: middle;
                }
                @media print {
                    body { background: white; padding: 0; }
                    .container { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="header-icon">📚</div>
                    <h1>دار تحفيظ القرآن الكريم</h1>
                    <p>✅ قائمة الواجبات</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card total">
                        <span class="stat-number">${assignments.length}</span>
                        <span class="stat-label">📋 إجمالي</span>
                    </div>
                    <div class="stat-card completed">
                        <span class="stat-number">${completed}</span>
                        <span class="stat-label">✅ مكتمل</span>
                    </div>
                    <div class="stat-card pending">
                        <span class="stat-number">${pending}</span>
                        <span class="stat-label">⌛ معلق</span>
                    </div>
                    <div class="stat-card overdue">
                        <span class="stat-number">${overdue}</span>
                        <span class="stat-label">⚠️ متأخر</span>
                    </div>
                </div>
                
                ${assignmentsHtml}
                
                <div class="footer">
                    <p><span class="footer-icon">⌛</span> تم الطباعة في: ${new Date().toLocaleString('ar-SA')}</p>
                    <p style="margin-top: 10px; font-size: 0.85rem; color: #95a5a6;">🕋 بارك الله فيكم</p>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
}

// طباعة بطاقة طالب
function printStudentCard(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    const studentAssignments = assignments.filter(a => a.studentId === id);
    const completedAssignments = studentAssignments.filter(a => a.status === 'مكتمل').length;
    const completionRate = studentAssignments.length > 0 ? Math.round((completedAssignments / studentAssignments.length) * 100) : 0;
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>بطاقة الطالب - ${student.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                @media print {
                    @page { size: A4; margin: 15mm; }
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Cairo', 'Arial', sans-serif; 
                    direction: rtl; 
                    text-align: right; 
                    background: linear-gradient(135deg, #f5f7fa 0%, #e8eef3 100%);
                    padding: 30px;
                    color: #2c3e50;
                }
                .card { 
                    background: white;
                    border: 3px solid transparent;
                    border-image: linear-gradient(135deg, #3498db, #8e44ad) 1;
                    border-radius: 15px;
                    padding: 30px;
                    max-width: 650px;
                    margin: 0 auto;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    padding: 25px;
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    color: white;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
                }
                .header-icon {
                    font-size: 3.5rem;
                    margin-bottom: 10px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                }
                .header h1 {
                    font-size: 1.8rem;
                    margin-bottom: 8px;
                    font-weight: 700;
                }
                .header h2 {
                    font-size: 1.3rem;
                    font-weight: 600;
                    opacity: 0.95;
                    margin-top: 10px;
                }
                .student-name {
                    text-align: center;
                    font-size: 2rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin: 20px 0;
                    padding: 15px;
                    background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
                    border-radius: 10px;
                }
                .info-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 15px; 
                    margin-bottom: 25px;
                }
                .info-item { 
                    padding: 15px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f1 100%);
                    border-radius: 10px;
                    border-left: 4px solid #3498db;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .info-icon {
                    font-size: 1.2rem;
                    margin-left: 8px;
                    color: #3498db;
                }
                .info-label { 
                    font-weight: 600;
                    color: #34495e;
                    font-size: 0.9rem;
                    margin-bottom: 5px;
                }
                .info-value { 
                    color: #2c3e50;
                    font-size: 1.1rem;
                    font-weight: 500;
                }
                .stats { 
                    background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
                    padding: 20px;
                    border-radius: 10px;
                    margin-top: 25px;
                    border-left: 5px solid #27ae60;
                    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.2);
                }
                .stats h3 {
                    color: #27ae60;
                    font-size: 1.4rem;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-top: 15px;
                }
                .stat-box {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .stat-number {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #27ae60;
                    display: block;
                }
                .stat-label {
                    font-size: 0.85rem;
                    color: #7f8c8d;
                    margin-top: 5px;
                }
                .progress-bar {
                    width: 100%;
                    height: 25px;
                    background: #ecf0f1;
                    border-radius: 15px;
                    overflow: hidden;
                    margin-top: 15px;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #27ae60 0%, #2ecc71 100%);
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    transition: width 0.3s ease;
                }
                .footer { 
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    color: #7f8c8d;
                    border-top: 2px solid #ecf0f1;
                    font-size: 0.9rem;
                }
                .footer-icon {
                    font-size: 1.2rem;
                    margin: 0 5px;
                    vertical-align: middle;
                }
                @media print {
                    body { background: white; padding: 0; }
                    .card { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <div class="header-icon">🎓</div>
                    <h1>🕌 دار تحفيظ القرآن الكريم</h1>
                    <h2>🏆 بطاقة الطالب</h2>
                </div>
                
                <div class="student-name">
                    👤 ${student.name}
                </div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label"><span class="info-icon">🎫</span>الكود الأكاديمي</div>
                        <div class="info-value">${student.academicCode}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><span class="info-icon">🎂</span>العمر</div>
                        <div class="info-value">${student.age} سنة</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><span class="info-icon">📊</span>المستوى</div>
                        <div class="info-value">${student.level}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><span class="info-icon">👨‍👩‍👧</span>ولي الأمر</div>
                        <div class="info-value">${student.parentName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><span class="info-icon">📞</span>رقم الهاتف</div>
                        <div class="info-value">${student.parentPhone}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><span class="info-icon">📅</span>تاريخ الانضمام</div>
                        <div class="info-value">${formatDate(student.joinDate)}</div>
                    </div>
                </div>
                
                <div class="stats">
                    <h3>📊 إحصائيات الأداء</h3>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <span class="stat-number">${studentAssignments.length}</span>
                            <span class="stat-label">إجمالي الواجبات</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-number">${completedAssignments}</span>
                            <span class="stat-label">المكتملة</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-number">${completionRate}%</span>
                            <span class="stat-label">نسبة الإنجاز</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${completionRate}%">
                            ${completionRate}%
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <p><span class="footer-icon">⌛</span> تم الطباعة في: ${new Date().toLocaleString('ar-SA')}</p>
                    <p style="margin-top: 10px; font-size: 0.85rem; color: #95a5a6;">🕋 بارك الله فيكم ونفع بكم</p>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
}

// إنشاء HTML لقائمة الطلاب للطباعة
function generateStudentsListHTML() {
    let html = `
        <table>
            <thead>
                <tr>
                    <th>🎫 الكود الأكاديمي</th>
                    <th>👤 اسم الطالب</th>
                    <th>🎂 العمر</th>
                    <th>👨‍👩‍👧 ولي الأمر</th>
                    <th>📞 رقم الهاتف</th>
                    <th>📊 المستوى</th>
                    <th>📅 تاريخ الانضمام</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    students.forEach(student => {
        html += `
            <tr>
                <td><strong>${student.academicCode}</strong></td>
                <td>${student.name}</td>
                <td>${student.age} سنة</td>
                <td>${student.parentName}</td>
                <td>${student.parentPhone}</td>
                <td><span class="level-badge level-${student.level}">${student.level}</span></td>
                <td>${formatDate(student.joinDate)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// إنشاء HTML لقائمة الواجبات للطباعة
function generateAssignmentsListHTML() {
    let html = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>👤 اسم الطالب</th>
                    <th>📖 نوع الواجب</th>
                    <th>📝 المحتوى</th>
                    <th>📅 تاريخ التسليم</th>
                    <th>🚩 الأولوية</th>
                    <th>📊 الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    assignments.forEach(assignment => {
        html += `
            <tr>
                <td><strong>#${assignment.id}</strong></td>
                <td>${assignment.studentName}</td>
                <td>${assignment.type}</td>
                <td>${assignment.content}</td>
                <td>${formatDate(assignment.dueDate)}</td>
                <td><span class="priority-badge priority-${assignment.priority}">${assignment.priority}</span></td>
                <td><span class="status-badge status-${assignment.status}">${assignment.status}</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// تصدير البيانات
function exportData() {
    const data = {
        students,
        assignments,
        nextStudentId,
        nextAssignmentId,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `quran_dar_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('تم تصدير البيانات بنجاح!', 'success');
}

// استيراد البيانات
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('هل أنت متأكد من استيراد البيانات؟ سيتم استبدال البيانات الحالية.')) {
                students = data.students || [];
                assignments = data.assignments || [];
                nextStudentId = data.nextStudentId || 1;
                nextAssignmentId = data.nextAssignmentId || 1;
                
                saveData();
                initializeApp();
                showNotification('تم استيراد البيانات بنجاح!', 'success');
            }
        } catch (error) {
            showNotification('خطأ في استيراد البيانات. تأكد من صحة الملف.', 'error');
        }
    };
    reader.readAsText(file);
}

// مسح جميع البيانات
function clearAllData() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        if (confirm('تأكيد أخير: سيتم حذف جميع بيانات الطلاب والواجبات نهائياً!')) {
            students = [];
            assignments = [];
            nextStudentId = 1;
            nextAssignmentId = 1;
            
            localStorage.clear();
            initializeApp();
            showNotification('تم مسح جميع البيانات!', 'success');
        }
    }
}

// حفظ البيانات في التخزين المحلي
function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('assignments', JSON.stringify(assignments));
    localStorage.setItem('nextStudentId', nextStudentId.toString());
    localStorage.setItem('nextAssignmentId', nextAssignmentId.toString());
}

// دوال مساعدة للتنسيق
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getStatusClass(status) {
    switch(status) {
        case 'مكتمل': return 'status-completed';
        case 'معلق': return 'status-pending';
        case 'متأخر': return 'status-overdue';
        default: return 'status-pending';
    }
}

function getPriorityClass(priority) {
    switch(priority) {
        case 'عادي': return 'priority-normal';
        case 'مهم': return 'priority-important';
        case 'عاجل': return 'priority-urgent';
        default: return 'priority-normal';
    }
}

// عرض الإشعارات
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notificationMessage');
    
    messageElement.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(hideNotification, 4000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('show');
}

// دوال التحرير
function editStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    // ملء النموذج بالبيانات الحالية
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentAge').value = student.age;
    document.getElementById('parentName').value = student.parentName;
    document.getElementById('parentPhone').value = student.parentPhone;
    document.getElementById('currentLevel').value = student.level;
    document.getElementById('joinDate').value = student.joinDate;
    
    // تغيير النموذج إلى وضع التعديل
    const form = document.getElementById('studentForm');
    form.dataset.editMode = 'true';
    form.dataset.editId = id;
    
    // تغيير نص الزر
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
    submitBtn.classList.add('btn-warning');
    submitBtn.classList.remove('btn-primary');
    
    // إظهار زر الإلغاء
    document.getElementById('cancelEditStudent').style.display = 'inline-flex';
    
    // التمرير للنموذج
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    showNotification('يمكنك الآن تعديل بيانات الطالب', 'info');
}

function editAssignment(id) {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;
    
    // ملء النموذج بالبيانات الحالية
    document.getElementById('studentSelect').value = assignment.studentId;
    document.getElementById('assignmentType').value = assignment.type;
    document.getElementById('assignmentContent').value = assignment.content;
    document.getElementById('dueDate').value = assignment.dueDate;
    document.getElementById('weeklyDays').value = assignment.weeklyDays;
    document.getElementById('estimatedDuration').value = assignment.estimatedDuration;
    document.getElementById('priority').value = assignment.priority;
    
    // تغيير النموذج إلى وضع التعديل
    const form = document.getElementById('assignmentForm');
    form.dataset.editMode = 'true';
    form.dataset.editId = id;
    
    // تغيير نص الزر
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
    submitBtn.classList.add('btn-warning');
    submitBtn.classList.remove('btn-primary');
    
    // إظهار زر الإلغاء
    document.getElementById('cancelEditAssignment').style.display = 'inline-flex';
    
    // التبديل إلى تبويب الواجبات
    document.querySelector('.tab-btn[data-tab="assignments"]').click();
    
    // التمرير للنموذج
    setTimeout(() => {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    
    showNotification('يمكنك الآن تعديل بيانات الواجب', 'info');
}

// تحديث الحالة التلقائي للواجبات المتأخرة
function updateOverdueAssignments() {
    const today = new Date().toISOString().split('T')[0];
    let updated = false;
    
    assignments.forEach(assignment => {
        if (assignment.status === 'معلق' && assignment.dueDate < today) {
            assignment.status = 'متأخر';
            updated = true;
        }
    });
    
    if (updated) {
        saveData();
        loadAssignmentsTable();
    }
}

// نسخ احتياطي تلقائي كل 5 دقائق
function autoBackup() {
    const lastBackup = localStorage.getItem('lastBackup');
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (!lastBackup || (now - parseInt(lastBackup)) > fiveMinutes) {
        const data = {
            students,
            assignments,
            nextStudentId,
            nextAssignmentId,
            backupDate: new Date().toISOString()
        };
        
        localStorage.setItem('autoBackup', JSON.stringify(data));
        localStorage.setItem('lastBackup', now.toString());
        console.log('✅ نسخة احتياطية تلقائية تم حفظها');
    }
}

// استعادة من النسخة الاحتياطية
function restoreFromBackup() {
    const backup = localStorage.getItem('autoBackup');
    if (!backup) {
        showNotification('لا توجد نسخة احتياطية متاحة', 'error');
        return;
    }
    
    if (confirm('هل تريد استعادة البيانات من النسخة الاحتياطية؟')) {
        try {
            const data = JSON.parse(backup);
            students = data.students || [];
            assignments = data.assignments || [];
            nextStudentId = data.nextStudentId || 1;
            nextAssignmentId = data.nextAssignmentId || 1;
            
            saveData();
            initializeApp();
            showNotification('تم استعادة البيانات من النسخة الاحتياطية!', 'success');
        } catch (error) {
            showNotification('خطأ في استعادة البيانات', 'error');
        }
    }
}

// تشغيل تحديث الحالة كل دقيقة
setInterval(updateOverdueAssignments, 60000);

// تشغيل النسخ الاحتياطي كل 5 دقائق
setInterval(autoBackup, 5 * 60 * 1000);

// تحديث الحالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updateOverdueAssignments();
    autoBackup();
});