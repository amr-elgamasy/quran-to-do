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
    
    // التحقق من البيانات
    if (!validateStudentData(formData)) {
        return;
    }
    
    // إضافة الطالب للقائمة
    students.push(formData);
    saveData();
    
    // تحديث الواجهة
    loadStudentsTable();
    loadStudentSelect();
    updateStats();
    
    // إعادة تعيين النموذج
    document.getElementById('studentForm').reset();
    setDefaultDates();
    
    showNotification('تم تسجيل الطالب بنجاح!', 'success');
}

// معالج إرسال نموذج الواجبات
function handleAssignmentSubmission(e) {
    e.preventDefault();
    
    const studentId = parseInt(document.getElementById('studentSelect').value);
    const student = students.find(s => s.id === studentId);
    
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
    
    // التحقق من البيانات
    if (!validateAssignmentData(formData)) {
        return;
    }
    
    // إضافة الواجب للقائمة
    assignments.push(formData);
    saveData();
    
    // تحديث الواجهة
    loadAssignmentsTable();
    updateStats();
    
    // إعادة تعيين النموذج
    document.getElementById('assignmentForm').reset();
    setDefaultDates();
    
    showNotification('تم إضافة الواجب بنجاح!', 'success');
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
            <style>
                body { font-family: 'Arial', sans-serif; direction: rtl; text-align: right; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #2c3e50; margin-bottom: 10px; }
                .header p { color: #7f8c8d; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .footer { margin-top: 30px; text-align: center; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🕌 دار تحفيظ القرآن الكريم</h1>
                <p>قائمة الطلاب المسجلين - ${formatDate(new Date().toISOString().split('T')[0])}</p>
            </div>
            ${studentsHtml}
            <div class="footer">
                <p>تم الطباعة في: ${new Date().toLocaleString('ar-SA')}</p>
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
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>قائمة الواجبات - دار تحفيظ القرآن</title>
            <style>
                body { font-family: 'Arial', sans-serif; direction: rtl; text-align: right; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #2c3e50; margin-bottom: 10px; }
                .header p { color: #7f8c8d; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .status-completed { background-color: #d4edda; color: #155724; }
                .status-pending { background-color: #fff3cd; color: #856404; }
                .footer { margin-top: 30px; text-align: center; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📚 دار تحفيظ القرآن الكريم</h1>
                <p>قائمة الواجبات - ${formatDate(new Date().toISOString().split('T')[0])}</p>
            </div>
            ${assignmentsHtml}
            <div class="footer">
                <p>تم الطباعة في: ${new Date().toLocaleString('ar-SA')}</p>
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
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>بطاقة الطالب - ${student.name}</title>
            <style>
                body { font-family: 'Arial', sans-serif; direction: rtl; text-align: right; margin: 20px; }
                .card { border: 2px solid #3498db; border-radius: 10px; padding: 20px; max-width: 600px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; color: #2c3e50; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
                .info-item { padding: 10px; background: #f8f9fa; border-radius: 5px; }
                .info-label { font-weight: bold; color: #34495e; }
                .info-value { color: #2c3e50; }
                .stats { background: #e8f4fd; padding: 15px; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #7f8c8d; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <h1>🕌 دار تحفيظ القرآن الكريم</h1>
                    <h2>بطاقة الطالب</h2>
                </div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">الكود الأكاديمي:</div>
                        <div class="info-value">${student.academicCode}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">اسم الطالب:</div>
                        <div class="info-value">${student.name}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">العمر:</div>
                        <div class="info-value">${student.age} سنة</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">المستوى:</div>
                        <div class="info-value">${student.level}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">ولي الأمر:</div>
                        <div class="info-value">${student.parentName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">رقم الهاتف:</div>
                        <div class="info-value">${student.parentPhone}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">تاريخ الانضمام:</div>
                        <div class="info-value">${formatDate(student.joinDate)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">تاريخ التسجيل:</div>
                        <div class="info-value">${formatDate(student.registrationDate)}</div>
                    </div>
                </div>
                
                <div class="stats">
                    <h3>إحصائيات الأداء</h3>
                    <p><strong>إجمالي الواجبات:</strong> ${studentAssignments.length}</p>
                    <p><strong>الواجبات المكتملة:</strong> ${completedAssignments}</p>
                    <p><strong>نسبة الإنجاز:</strong> ${studentAssignments.length > 0 ? Math.round((completedAssignments / studentAssignments.length) * 100) : 0}%</p>
                </div>
                
                <div class="footer">
                    <p>تم الطباعة في: ${new Date().toLocaleString('ar-SA')}</p>
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
                    <th>الكود الأكاديمي</th>
                    <th>اسم الطالب</th>
                    <th>العمر</th>
                    <th>ولي الأمر</th>
                    <th>رقم الهاتف</th>
                    <th>المستوى</th>
                    <th>تاريخ الانضمام</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    students.forEach(student => {
        html += `
            <tr>
                <td>${student.academicCode}</td>
                <td>${student.name}</td>
                <td>${student.age} سنة</td>
                <td>${student.parentName}</td>
                <td>${student.parentPhone}</td>
                <td>${student.level}</td>
                <td>${formatDate(student.joinDate)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <p style="margin-top: 20px;"><strong>إجمالي الطلاب:</strong> ${students.length}</p>
    `;
    
    return html;
}

// إنشاء HTML لقائمة الواجبات للطباعة
function generateAssignmentsListHTML() {
    let html = `
        <table>
            <thead>
                <tr>
                    <th>رقم الواجب</th>
                    <th>اسم الطالب</th>
                    <th>نوع الواجب</th>
                    <th>المحتوى</th>
                    <th>تاريخ التسليم</th>
                    <th>الحالة</th>
                    <th>الأولوية</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    assignments.forEach(assignment => {
        html += `
            <tr class="${assignment.status === 'مكتمل' ? 'status-completed' : 'status-pending'}">
                <td>#${assignment.id}</td>
                <td>${assignment.studentName}</td>
                <td>${assignment.type}</td>
                <td>${assignment.content}</td>
                <td>${formatDate(assignment.dueDate)}</td>
                <td>${assignment.status}</td>
                <td>${assignment.priority}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <p style="margin-top: 20px;">
            <strong>إجمالي الواجبات:</strong> ${assignments.length} | 
            <strong>المكتملة:</strong> ${assignments.filter(a => a.status === 'مكتمل').length} | 
            <strong>المعلقة:</strong> ${assignments.filter(a => a.status === 'معلق').length}
        </p>
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

// دوال التحرير (يمكن تطويرها لاحقاً)
function editStudent(id) {
    showNotification('ميزة التحرير قيد التطوير', 'info');
}

function editAssignment(id) {
    showNotification('ميزة التحرير قيد التطوير', 'info');
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

// تشغيل تحديث الحالة كل دقيقة
setInterval(updateOverdueAssignments, 60000);

// تحديث الحالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', updateOverdueAssignments);