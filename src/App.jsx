import { Component, useEffect, useMemo, useRef, useState } from "react";

const USERS_KEY = "iti_pm_users";
const PROJECTS_KEY = "iti_pm_projects";
const ACTIVE_USER_KEY = "iti_pm_active_user";
const ARCHIVED_PROJECTS_KEY = "iti_pm_archived_projects";
const ACTIVITY_LOGS_KEY = "iti_pm_activity_logs";
const NOTIFICATIONS_KEY = "iti_pm_notifications";
const DEMO_DATASET_VERSION_KEY = "iti_pm_demo_dataset_version";
const DEMO_DATASET_VERSION = "dashboard-real-data-1year-2026-05";
const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  USER: "USER"
};

const nowIso = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const DEMO_REFERENCE_DATE = new Date("2026-05-19T09:00:00.000");
const DEMO_PROJECT_COUNT = 360;
const PROJECT_PAGE_SIZE = 12;
const TASK_PAGE_SIZE = 20;

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error) {
      return (
        <div className="iti-page">
          <section className="iti-card app-error-card">
            <h3>Tampilan gagal dimuat</h3>
            <p>{this.state.error?.message || "Terjadi error saat membuka menu."}</p>
            <button type="button" onClick={this.props.onRecover}>Kembali ke Dashboard</button>
          </section>
        </div>
      );
    }
    return this.props.children;
  }
}

const seedUsers = [
  { id: "u_super", name: "Super Admin", role: ROLES.SUPER_ADMIN, createdBy: null, unit: "Team PDSI" },
  { id: "u_admin_a", name: "Admin A", role: ROLES.ADMIN, createdBy: "u_super", unit: "Rektor" },
  { id: "u_admin_b", name: "Admin B", role: ROLES.ADMIN, createdBy: "u_super", unit: "Warek A" },
  { id: "u_moderator_a", name: "Moderator A", role: ROLES.MODERATOR, createdBy: "u_admin_a", unit: "Kepala PMB" },
  { id: "u_user_a", name: "User A", role: ROLES.USER, createdBy: "u_moderator_a", unit: "Staf PMB" },
  { id: "u_user_b", name: "User B", role: ROLES.USER, createdBy: "u_admin_a", unit: "Staf PKA" },
  { id: "u_user_c", name: "User C", role: ROLES.USER, createdBy: "u_admin_b", unit: "Staf Program Studi" }
];

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDatetimeLocal(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function makeDemoProjects() {
  const projectNames = [
    "Website Company Profile ITI",
    "SOP Operasional Tim",
    "Dashboard Monitoring Akademik",
    "Portal Pendaftaran Mahasiswa",
    "Aplikasi Inventaris Laboratorium",
    "Integrasi Presensi Digital",
    "Knowledge Base Internal",
    "Sistem Ticketing IT Support",
    "Landing Page Program Studi",
    "Automasi Laporan Bulanan",
    "CRM Kerja Sama Industri",
    "Data Warehouse Kampus",
    "Aplikasi Survey Kepuasan",
    "Manajemen Event Kampus",
    "Sistem Arsip Digital",
    "Monitoring Kinerja Program Studi",
    "Audit Dokumen Akreditasi",
    "Pusat Data Mahasiswa",
    "Helpdesk Layanan Akademik",
    "Manajemen Fasilitas Kampus"
  ];
  const taskNames = [
    "Susun struktur halaman",
    "Kumpulkan asset visual",
    "Draft SOP harian",
    "Validasi kebutuhan user",
    "Implementasi modul utama",
    "Review data dan konten",
    "Uji coba fitur",
    "Perbaikan UI responsif",
    "Migrasi data awal",
    "Finalisasi laporan",
    "Koordinasi lintas unit",
    "Verifikasi dokumen pendukung"
  ];
  const creators = [
    { id: "u_super", assignees: ["u_super", "u_admin_a", "u_admin_b", "u_moderator_a", "u_user_a", "u_user_b", "u_user_c"] },
    { id: "u_admin_a", assignees: ["u_admin_a", "u_moderator_a", "u_user_a", "u_user_b"] },
    { id: "u_admin_b", assignees: ["u_admin_b", "u_user_c"] },
    { id: "u_moderator_a", assignees: ["u_moderator_a", "u_user_a", "u_user_b"] }
  ];
  const totalProjects = DEMO_PROJECT_COUNT;
  const firstMonth = new Date("2025-06-01T08:00:00.000");

  return Array.from({ length: totalProjects }, (_, index) => {
    const creator = creators[index % creators.length];
    const monthOffset = index % 12;
    const monthBase = new Date(firstMonth);
    monthBase.setMonth(firstMonth.getMonth() + monthOffset);
    const createdAt = addDays(monthBase, (index * 3) % 25);
    createdAt.setHours(8 + (index % 8), index % 2 ? 30 : 0, 0, 0);
    const deadlineAt = addDays(createdAt, 21 + (index % 65));
    deadlineAt.setHours(17, 0, 0, 0);
    const taskCount = index % 2 === 0 ? 2 : 1;
    const projectAssignees = Array.from(
      new Set([
        creator.assignees[index % creator.assignees.length],
        creator.assignees[(index + 2) % creator.assignees.length],
        ...(index % 8 === 0 ? [creator.assignees[(index + 3) % creator.assignees.length]] : [])
      ].filter(Boolean))
    );

    const tasks = Array.from({ length: taskCount }, (_, taskIndex) => {
      const taskCreatedAt = addDays(createdAt, taskIndex * 2);
      const taskDeadline = addDays(createdAt, 6 + taskIndex * 9 + (index % 22));
      taskDeadline.setHours(17, 0, 0, 0);
      const assignee = projectAssignees[taskIndex % projectAssignees.length];
      const secondaryAssignee = index % 18 === 0 ? projectAssignees[(taskIndex + 1) % projectAssignees.length] : null;
      const assignedTo = secondaryAssignee && secondaryAssignee !== assignee ? [assignee, secondaryAssignee] : [assignee];
      const isRecentWindow = taskDeadline.getTime() >= addDays(DEMO_REFERENCE_DATE, -45).getTime();
      const isSubmittedReview = isRecentWindow && index % 7 === 0;
      const isOpenActive = isRecentWindow && !isSubmittedReview && index % 5 === 0;
      const shouldComplete = !isOpenActive && !isSubmittedReview && (taskDeadline.getTime() < addDays(DEMO_REFERENCE_DATE, -7).getTime() || index % 4 !== 0);
      const completedAtDate = shouldComplete ? addDays(taskDeadline, -Math.max(1, (index + taskIndex) % 10)) : null;
      const submittedAtDate = shouldComplete ? addDays(completedAtDate, -1) : (isSubmittedReview ? addDays(taskDeadline, -2) : null);
      const completedAt = completedAtDate ? completedAtDate.toISOString() : null;
      const submittedAt = submittedAtDate ? submittedAtDate.toISOString() : null;
      const completedBy = Object.fromEntries(
        assignedTo.map((userId) => [userId, { isCompleted: shouldComplete, completedAt, reviewedBy: shouldComplete ? creator.id : null }])
      );

      return {
        id: `t_demo_${index}_${taskIndex}`,
        title: taskNames[(index + taskIndex) % taskNames.length],
        description: `Task demo historis 1-2 tahun untuk ${projectNames[index % projectNames.length]} periode ${createdAt.getFullYear()}.`,
        instructionAttachments: taskIndex === 0 && index % 11 === 0 ? [{ name: `brief-project-${index + 1}.pdf`, type: "application/pdf", size: 180000 + index * 120 }] : [],
        assignedTo,
        createdBy: creator.id,
        createdAt: taskCreatedAt.toISOString(),
        deadlineAt: toDatetimeLocal(taskDeadline),
        isCompleted: shouldComplete,
        completedAt,
        completedBy,
        reviewStatus: shouldComplete ? "approved" : isSubmittedReview ? "submitted" : "open",
        reviewedBy: shouldComplete ? creator.id : null,
        reviewedAt: shouldComplete ? completedAt : null,
        completionProof: {
          note: shouldComplete || isSubmittedReview ? "Bukti pekerjaan demo sudah dikirim untuk simulasi performa." : "",
          links: shouldComplete && index % 7 === 0 ? [`https://example.com/demo/${index + 1}`] : [],
          files: [],
          submissions: (shouldComplete || isSubmittedReview)
            ? [
                {
                  id: `proof_demo_${index}_${taskIndex}`,
                  submittedBy: assignedTo[0],
                  submittedAt,
                  status: shouldComplete ? "approved" : "submitted",
                  reviewedBy: shouldComplete ? creator.id : null,
                  reviewedAt: shouldComplete ? completedAt : null,
                  note: shouldComplete ? "Progress sudah sesuai checklist demo dan telah diverifikasi." : "Bukti sudah dikirim dan menunggu review.",
                  links: [],
                  files: []
                }
              ]
            : []
        },
        comments: []
      };
    });

    return {
      id: `p_demo_${index}`,
      title: `${projectNames[index % projectNames.length]} ${String(index + 1).padStart(3, "0")}`,
      description: `Project demo untuk mensimulasikan aktivitas ITI selama 1-2 tahun dengan data task real di dashboard.`,
      createdBy: creator.id,
      ownerId: creator.id,
      managerIds: index % 9 === 0 ? ["u_moderator_a"] : [],
      assignedTo: projectAssignees,
      createdAt: createdAt.toISOString(),
      deadlineAt: toDatetimeLocal(deadlineAt),
      status: tasks.every((task) => task.isCompleted) ? "completed" : tasks.some((task) => task.reviewStatus === "submitted") ? "review" : "running",
      tasks
    };
  });
}

function makeRunnableDemoProject() {
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  const projectDeadline = addDays(base, 21);
  projectDeadline.setHours(17, 0, 0, 0);
  return {
    id: makeId("p_runnable"),
    title: "Contoh Project Aktif untuk Submit Bukti",
    description: "Project demo khusus agar tester dapat mencoba submit bukti, review, reject, verified checked, komentar, dan lampiran.",
    createdBy: "u_admin_a",
    ownerId: "u_admin_a",
    managerIds: ["u_moderator_a"],
    assignedTo: ["u_admin_a", "u_moderator_a", "u_user_a", "u_user_b"],
    createdAt: nowIso(),
    deadlineAt: toDatetimeLocal(projectDeadline),
    tasks: [
      {
        id: makeId("t_runnable"),
        title: "Upload bukti pekerjaan desain dashboard",
        description: "Task ini sengaja belum disubmit agar role User bisa mencoba submit file/gambar dan catatan.",
        instructionAttachments: [{ name: "brief-submit-demo.pdf", type: "application/pdf", size: 245760 }],
        assignedTo: ["u_user_a", "u_user_b"],
        createdBy: "u_admin_a",
        createdAt: nowIso(),
        deadlineAt: toDatetimeLocal(addDays(base, 5)),
        isCompleted: false,
        completedAt: null,
        completedBy: {},
        reviewStatus: "open",
        completionProof: { note: "", links: [], files: [], submissions: [] },
        comments: []
      },
      {
        id: makeId("t_runnable"),
        title: "Validasi konten halaman project",
        description: "Task aktif untuk Admin/Moderator agar bisa submit bukti seperti user biasa.",
        instructionAttachments: [],
        assignedTo: ["u_admin_b", "u_moderator_a"],
        createdBy: "u_admin_a",
        createdAt: nowIso(),
        deadlineAt: toDatetimeLocal(addDays(base, 8)),
        isCompleted: false,
        completedAt: null,
        completedBy: {},
        reviewStatus: "open",
        completionProof: { note: "", links: [], files: [], submissions: [] },
        comments: []
      }
    ]
  };
}

const seedProjects = makeDemoProjects();

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function projectTaskCount(projects = []) {
  return projects.reduce((sum, project) => sum + (project.tasks || []).length, 0);
}

function makeDemoProjectDataset() {
  return [makeRunnableDemoProject(), ...seedProjects];
}

function isLegacyDemoDataset(projects = []) {
  const demoProjects = projects.filter((project) => String(project.id || "").startsWith("p_demo_")).length;
  if (!demoProjects) return false;
  const totalDemoRecords = demoProjects + projectTaskCount(projects);
  return demoProjects !== DEMO_PROJECT_COUNT || totalDemoRecords < 800 || totalDemoRecords > 1000;
}

function readInitialProjects() {
  const stored = readStorage(PROJECTS_KEY, null);
  if (!Array.isArray(stored)) {
    localStorage.setItem(DEMO_DATASET_VERSION_KEY, DEMO_DATASET_VERSION);
    return makeDemoProjectDataset();
  }
  const storedVersion = localStorage.getItem(DEMO_DATASET_VERSION_KEY);
  if (storedVersion !== DEMO_DATASET_VERSION && isLegacyDemoDataset(stored)) {
    localStorage.setItem(DEMO_DATASET_VERSION_KEY, DEMO_DATASET_VERSION);
    return makeDemoProjectDataset();
  }
  return stored;
}

function makeLog(action, detail, userId, meta = {}) {
  return {
    id: makeId("log"),
    action,
    detail,
    userId,
    projectId: meta.projectId || null,
    taskId: meta.taskId || null,
    page: meta.page || null,
    createdAt: nowIso()
  };
}

function downloadTextFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function exportRowsToCsv(filename, headers, rows) {
  const content = [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
  downloadTextFile(filename, content, "text/csv;charset=utf-8");
}

function exportRowsToPdf(title, headers, rows) {
  const htmlRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  const popup = window.open("", "_blank");
  if (!popup) return alert("Popup diblokir browser. Izinkan popup untuk export PDF.");
  popup.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { font-size: 20px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
          th { background: #fff1e8; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <table>
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
          <tbody>${htmlRows}</tbody>
        </table>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

function printFile(url) {
  const popup = window.open(url, "_blank");
  if (!popup) return alert("Popup diblokir browser. Izinkan popup untuk print file.");
  popup.addEventListener("load", () => popup.print(), { once: true });
}

function confirmAction(message) {
  return window.confirm(message);
}

function stripSessionFileData(files = []) {
  return files.map(({ previewUrl, ...file }) => ({
    ...file,
    dataUrl: file.dataUrl || (String(previewUrl || "").startsWith("data:") ? previewUrl : file.dataUrl)
  }));
}

function sanitizeProjectsForStorage(projects) {
  return projects.map((project) => ({
    ...project,
    tasks: project.tasks.map((task) => ({
      ...task,
      instructionAttachments: stripSessionFileData(task.instructionAttachments || []),
      completionProof: task.completionProof
        ? {
            ...task.completionProof,
            files: stripSessionFileData(task.completionProof.files || []),
            submissions: (task.completionProof.submissions || []).map((submission) => ({
              ...submission,
              files: stripSessionFileData(submission.files || [])
            }))
          }
        : task.completionProof
    }))
  }));
}

function normalizeProjects(projects = []) {
  return (Array.isArray(projects) ? projects : []).map((project) => {
    const ownerId = project.ownerId || project.createdBy || "u_super";
    const managerIds = Array.isArray(project.managerIds) ? project.managerIds.filter(Boolean) : [];
    const assignedTo = Array.from(new Set([
      ownerId,
      ...managerIds,
      ...(Array.isArray(project.assignedTo) ? project.assignedTo : project.assignedTo ? [project.assignedTo] : [])
    ].filter(Boolean)));
    const projectDeadline = project.deadlineAt || toDatetimeLocal(addDays(new Date(), 14));
    const tasks = (Array.isArray(project.tasks) ? project.tasks : []).map((task) => {
      const taskAssignees = Array.isArray(task.assignedTo) ? task.assignedTo.filter(Boolean) : task.assignedTo ? [task.assignedTo] : [];
      const rawSubmissions = task.completionProof?.submissions || [];
      const legacyCompleted = task.isCompleted || Object.values(task.completedBy || {}).some((entry) => entry?.isCompleted);
      const submissions = rawSubmissions.map((submission) => ({
        id: submission.id || makeId("proof"),
        submittedBy: submission.submittedBy || taskAssignees[0] || task.createdBy || ownerId,
        submittedAt: submission.submittedAt || task.completedAt || task.createdAt || nowIso(),
        note: submission.note || "",
        links: Array.isArray(submission.links) ? submission.links : [],
        files: stripSessionFileData(submission.files || []),
        status: submission.status || (legacyCompleted ? "approved" : "submitted"),
        reviewedBy: submission.reviewedBy || (legacyCompleted ? task.reviewedBy || task.createdBy || ownerId : null),
        reviewedAt: submission.reviewedAt || (legacyCompleted ? task.completedAt || task.reviewedAt || submission.submittedAt : null),
        reviewNote: submission.reviewNote || ""
      })).sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
      const latest = submissions[0];
      const reviewStatus = task.reviewStatus || (legacyCompleted ? "approved" : latest?.status === "rejected" ? "rejected" : latest?.status === "submitted" ? "submitted" : "open");
      const completedBy = { ...(task.completedBy || {}) };
      if ((reviewStatus === "approved" || reviewStatus === "verified") && latest?.submittedBy) {
        completedBy[latest.submittedBy] = { isCompleted: true, completedAt: latest.reviewedAt || task.completedAt || nowIso(), reviewedBy: latest.reviewedBy || task.reviewedBy || ownerId };
      }
      const comments = (task.comments || []).map((comment) => ({
        id: comment.id || makeId("comment"),
        body: comment.body ?? comment.text ?? "",
        createdBy: comment.createdBy || comment.userId || task.createdBy || ownerId,
        createdAt: comment.createdAt || nowIso()
      })).filter((comment) => comment.body);
      const safeTaskDeadline = task.deadlineAt && new Date(task.deadlineAt).getTime() <= new Date(projectDeadline).getTime() ? task.deadlineAt : projectDeadline;
      return {
        ...task,
        assignedTo: taskAssignees,
        deadlineAt: safeTaskDeadline,
        completedBy,
        reviewStatus,
        isCompleted: ["approved", "verified"].includes(reviewStatus),
        completedAt: ["approved", "verified"].includes(reviewStatus) ? (task.completedAt || latest?.reviewedAt || latest?.submittedAt || null) : null,
        instructionAttachments: stripSessionFileData(task.instructionAttachments || []),
        completionProof: { ...(task.completionProof || {}), submissions, files: stripSessionFileData(task.completionProof?.files || []) },
        comments
      };
    });
    return { ...project, ownerId, managerIds, assignedTo, deadlineAt: projectDeadline, tasks };
  });
}

function getUserName(users, id) {
  return users.find((user) => user.id === id)?.name || "Tidak diketahui";
}

function getProjectOwnerId(project) {
  return project.ownerId || project.createdBy;
}

function getProjectManagerIds(project) {
  return Array.isArray(project.managerIds) ? project.managerIds : [];
}

function getProjectAssigneeIds(project) {
  if (Array.isArray(project.assignedTo)) return Array.from(new Set([getProjectOwnerId(project), ...getProjectManagerIds(project), ...project.assignedTo].filter(Boolean)));
  return Array.from(new Set([getProjectOwnerId(project), ...getProjectManagerIds(project), project.assignedTo].filter(Boolean)));
}

function getProjectTaskRefs(project) {
  return (project.tasks || []).map((task) => ({ projectId: project.id, taskId: task.id, task }));
}

function getProjectAssigneeNames(users, project) {
  const names = getProjectAssigneeIds(project).map((id) => getUserName(users, id));
  return names.length ? names.join(", ") : "Belum ditugaskan";
}

function getTaskAssigneeIds(task) {
  if (Array.isArray(task.assignedTo)) return task.assignedTo;
  return task.assignedTo ? [task.assignedTo] : [];
}

function getTaskAssigneeNames(users, task) {
  const names = getTaskAssigneeIds(task).map((id) => getUserName(users, id));
  return names.length ? names.join(", ") : "Belum ditugaskan";
}

function getTaskCompletedBy(task, userId) {
  if (task.completedBy?.[userId]) return task.completedBy[userId];
  if (task.isCompleted && getTaskAssigneeIds(task).includes(userId)) {
    return { isCompleted: true, completedAt: task.completedAt || null };
  }
  return { isCompleted: false, completedAt: null };
}

function isTaskCompletedBy(task, userId) {
  return !!getTaskCompletedBy(task, userId).isCompleted;
}

function getTaskCompletionCounts(task) {
  const assigneeIds = getTaskAssigneeIds(task);
  const total = assigneeIds.length || 1;
  if (isTaskFullyCompleted(task)) return { completed: total, total };
  const completed = assigneeIds.filter((id) => isTaskCompletedBy(task, id)).length;
  return { completed, total };
}

function isTaskFullyCompleted(task) {
  if (!task) return false;
  if (["reopened", "rejected", "submitted", "open"].includes(task.reviewStatus)) return false;
  if (["approved", "verified"].includes(task.reviewStatus)) return true;
  const latest = getLatestSubmission(task);
  if (["approved", "verified"].includes(latest?.status)) return true;
  const submissions = task.completionProof?.submissions || [];
  // Kompatibilitas data lama tanpa riwayat submit: completedBy dianggap data verified.
  if (!submissions.length && Object.values(task.completedBy || {}).some((entry) => entry?.isCompleted)) return true;
  return false;
}

function getTaskReviewState(task) {
  if (isTaskFullyCompleted(task)) return { label: "Selesai / Verified", tone: "done" };
  const latest = getLatestSubmission(task);
  if (latest?.status === "rejected") return { label: "Ditolak / Perlu Revisi", tone: "danger" };
  if (latest?.status === "submitted") return { label: "Menunggu Review", tone: "review" };
  if (isPastDeadline(task.deadlineAt)) return { label: "Lewat Deadline", tone: "danger" };
  return { label: "Belum Submit", tone: "active" };
}

function getLatestSubmission(task) {
  const submissions = task?.completionProof?.submissions || [];
  return [...submissions].sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))[0] || null;
}

function getTaskSubmitterLabel(users, task) {
  const latest = getLatestSubmission(task);
  if (!latest?.submittedBy) return "Belum ada submit";
  return `${getUserName(users, latest.submittedBy)} • ${formatDate(latest.submittedAt)}`;
}

function roleLabel(role) {
  if (role === ROLES.SUPER_ADMIN) return "SUPERADMIN";
  return role;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function normalizeSearch(value) {
  return String(value || "").toLowerCase().trim();
}

function includesSearch(value, query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  return normalizeSearch(value).includes(normalizedQuery);
}

function projectMatchesSearch(project, users, query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  return [
    project.title,
    project.description,
    getUserName(users, getProjectOwnerId(project)),
    getProjectAssigneeNames(users, project),
    formatDate(project.createdAt),
    formatDate(project.deadlineAt),
    project.tasks.map((task) => `${task.title} ${task.description} ${getTaskAssigneeNames(users, task)} ${formatDate(task.deadlineAt)}`).join(" ")
  ].some((value) => includesSearch(value, normalizedQuery));
}

function taskMatchesSearch(task, project, users, query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  return [
    task.title,
    task.description,
    project.title,
    project.description,
    getUserName(users, task.createdBy || project.createdBy),
    getTaskAssigneeNames(users, task),
    formatDate(task.deadlineAt),
    formatDate(task.completedAt)
  ].some((value) => includesSearch(value, normalizedQuery));
}

function userMatchesSearch(user, users, query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  return [
    user.name,
    roleLabel(user.role),
    getUserName(users, user.createdBy)
  ].some((value) => includesSearch(value, normalizedQuery));
}

function isPastDeadline(value) {
  return !!value && new Date(value).getTime() < Date.now();
}

function getDeadlineState(value, isCompleted) {
  if (!value) return { label: "Belum ada deadline", tone: "neutral", isOverdue: false };
  if (isCompleted) return { label: "Selesai", tone: "done", isOverdue: false };
  if (isPastDeadline(value)) return { label: "Lewat deadline", tone: "danger", isOverdue: true };
  return { label: "On track", tone: "active", isOverdue: false };
}

function isDueSoon(value, days = 7) {
  if (!value) return false;
  const deadline = new Date(value).getTime();
  const now = Date.now();
  return deadline >= now && deadline <= now + days * 24 * 60 * 60 * 1000;
}

function getProjectOverdueTasks(project) {
  return project.tasks.filter((task) => !isTaskFullyCompleted(task) && isPastDeadline(task.deadlineAt));
}

function proofStatusLabel(status = "submitted") {
  const labels = {
    submitted: "Submitted",
    reviewed: "Reviewed",
    approved: "Approved",
    rejected: "Rejected"
  };
  return labels[status] || labels.submitted;
}

function canReviewProof(currentUser, project, task) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  if (currentUser.role === ROLES.USER) return false;
  return currentUser.id === getProjectOwnerId(project) || currentUser.id === task.createdBy;
}

function canReopenTask(currentUser, project, task) {
  return isTaskFullyCompleted(task) && canReviewProof(currentUser, project, task);
}

function canCommentTask(currentUser, project, task) {
  return isProjectMember(project, currentUser.id) || getTaskAssigneeIds(task).includes(currentUser.id) || currentUser.role === ROLES.SUPER_ADMIN;
}

function canDeleteComment(currentUser, project, task, comment) {
  return currentUser.role === ROLES.SUPER_ADMIN || comment.createdBy === currentUser.id || getProjectOwnerId(project) === currentUser.id || task.createdBy === currentUser.id;
}

function fileMetaList(fileList) {
  return Array.from(fileList || []).map((file) => ({
    name: file.name,
    type: file.type || "unknown",
    size: file.size,
    previewUrl: URL.createObjectURL(file)
  }));
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function fileMetaListAsync(fileList, maxInlineSize = 2.5 * 1024 * 1024) {
  const files = Array.from(fileList || []);
  return Promise.all(files.map(async (file) => {
    const canInline = file.size <= maxInlineSize;
    const dataUrl = canInline ? await fileToDataUrl(file) : null;
    return {
      name: file.name,
      type: file.type || "unknown",
      size: file.size,
      previewUrl: dataUrl || URL.createObjectURL(file),
      dataUrl,
      persisted: !!dataUrl,
      note: dataUrl ? "File tersimpan di localStorage sebagai data URL." : "File terlalu besar untuk disimpan permanen; preview tersedia selama sesi upload."
    };
  }));
}

function getFileHref(file) {
  return file?.dataUrl || file?.previewUrl || "";
}

function getProjectProgress(project) {
  const total = project.tasks.length;
  if (!total) return 0;
  const completed = project.tasks.filter((task) => isTaskFullyCompleted(task)).length;
  return Math.round((completed / total) * 100);
}

function getProjectStatus(project) {
  if (project.status === "draft" && !(project.tasks || []).length) return "draft";
  if (project.status === "review") return "review";
  if (project.status === "completed") return "completed";
  const progress = getProjectProgress(project);
  if (progress >= 100) return "completed";
  if ((project.tasks || []).some((task)=>(task.completionProof?.submissions||[]).some((submission)=>submission.status === "submitted") && !isTaskFullyCompleted(task))) return "review";
  if (isPastDeadline(project.deadlineAt)) return "overdue";
  return "running";
}

function isThisMonth(value) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function sortProjects(list, sortBy) {
  const sorted = [...list];
  const time = (value, fallback) => (value ? new Date(value).getTime() : fallback);
  if (sortBy === "deadline_asc") sorted.sort((a, b) => time(a.deadlineAt, Infinity) - time(b.deadlineAt, Infinity));
  if (sortBy === "progress_desc") sorted.sort((a, b) => getProjectProgress(b) - getProjectProgress(a));
  if (sortBy === "progress_asc") sorted.sort((a, b) => getProjectProgress(a) - getProjectProgress(b));
  if (sortBy === "newest") sorted.sort((a, b) => time(b.createdAt, 0) - time(a.createdAt, 0));
  if (sortBy === "oldest") sorted.sort((a, b) => time(a.createdAt, Infinity) - time(b.createdAt, Infinity));
  return sorted;
}

function sortTaskItems(list, sortBy) {
  const sorted = [...list];
  const time = (value, fallback) => (value ? new Date(value).getTime() : fallback);
  if (sortBy === "deadline_asc") sorted.sort((a, b) => time(a.task.deadlineAt, Infinity) - time(b.task.deadlineAt, Infinity));
  if (sortBy === "progress_desc") sorted.sort((a, b) => {
    const ap = getTaskCompletionCounts(a.task);
    const bp = getTaskCompletionCounts(b.task);
    return (bp.completed / bp.total) - (ap.completed / ap.total);
  });
  if (sortBy === "progress_asc") sorted.sort((a, b) => {
    const ap = getTaskCompletionCounts(a.task);
    const bp = getTaskCompletionCounts(b.task);
    return (ap.completed / ap.total) - (bp.completed / bp.total);
  });
  if (sortBy === "newest") sorted.sort((a, b) => time(b.task.createdAt || b.project.createdAt, 0) - time(a.task.createdAt || a.project.createdAt, 0));
  if (sortBy === "oldest") sorted.sort((a, b) => time(a.task.createdAt || a.project.createdAt, Infinity) - time(b.task.createdAt || b.project.createdAt, Infinity));
  return sorted;
}

function getProjectActivityTimeline(projects) {
  const dates = projects.flatMap((project) => [
    new Date(project.createdAt || 0),
    ...project.tasks.map((task) => new Date(task.completedAt || task.deadlineAt || project.createdAt || 0))
  ]).filter((date) => !Number.isNaN(date.getTime()));
  const latestDate = dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : new Date(DEMO_REFERENCE_DATE);
  latestDate.setDate(1);
  latestDate.setHours(23, 59, 59, 999);

  const months = Array.from({ length: 12 }, (_, index) => {
    const monthStart = new Date(latestDate);
    monthStart.setMonth(latestDate.getMonth() - (11 - index));
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthStart.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);
    const activeTasks = projects
      .filter((project) => new Date(project.createdAt).getTime() <= monthEnd.getTime())
      .flatMap((project) => project.tasks);
    const completedTasks = activeTasks.filter((task) => isTaskFullyCompleted(task) && new Date(task.completedAt || task.reviewedAt || task.completionProof?.submissions?.[0]?.reviewedAt || task.deadlineAt || monthEnd).getTime() <= monthEnd.getTime());
    const value = activeTasks.length ? Math.round((completedTasks.length / activeTasks.length) * 100) : 0;

    return {
      label: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(monthStart),
      value
    };
  });

  const points = months.map((month, index) => {
    const x = 12 + index * (696 / Math.max(months.length - 1, 1));
    const y = 140 - month.value * 1.18;
    return { ...month, x, y };
  });

  return {
    months,
    points,
    path: points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")
  };
}

function getSubordinateIds(currentUser, users) {
  return users.filter((user) => user.createdBy === currentUser.id).map((user) => user.id);
}

function canManageTeam(currentUser) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role);
}

function getCreatableRoles(currentUser) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return [ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER];
  if (currentUser.role === ROLES.ADMIN) return [ROLES.MODERATOR, ROLES.USER];
  if (currentUser.role === ROLES.MODERATOR) return [ROLES.USER];
  return [];
}

function canCreateRole(currentUser, role) {
  return getCreatableRoles(currentUser).includes(role);
}

function canAssignUser(currentUser, user) {
  if (!user) return false;
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  if (currentUser.role === ROLES.ADMIN) return user.role !== ROLES.SUPER_ADMIN;
  if (currentUser.role === ROLES.MODERATOR) return [ROLES.MODERATOR, ROLES.USER].includes(user.role);
  return user.id === currentUser.id;
}

function isProjectMember(project, userId) {
  return getProjectOwnerId(project) === userId || getProjectAssigneeIds(project).includes(userId) || getProjectManagerIds(project).includes(userId);
}

function canEditProject(currentUser, project) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  return [ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role) && getProjectOwnerId(project) === currentUser.id;
}

function canArchiveProject(currentUser, project) {
  return canDeleteProject(currentUser, project) && getProjectProgress(project) >= 100;
}

function canManageProjectMembers(currentUser, project) {
  return canEditProject(currentUser, project);
}

function canCreateUser(currentUser) {
  return canManageTeam(currentUser);
}

function canDeleteUser(currentUser, targetUser, users) {
  if (!targetUser || currentUser.id === targetUser.id) return false;
  if (targetUser.role === ROLES.SUPER_ADMIN && users.filter((user) => user.role === ROLES.SUPER_ADMIN).length <= 1) return false;
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  if (currentUser.role === ROLES.ADMIN) return [ROLES.MODERATOR, ROLES.USER].includes(targetUser.role) && targetUser.createdBy === currentUser.id;
  if (currentUser.role === ROLES.MODERATOR) return targetUser.role === ROLES.USER && targetUser.createdBy === currentUser.id;
  return false;
}

function canChangeRole(currentUser) {
  return currentUser.role === ROLES.SUPER_ADMIN;
}

function canCreateProject(currentUser) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role);
}

function canDeleteProject(currentUser, project) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  return [ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role) && getProjectOwnerId(project) === currentUser.id;
}

function canRestoreProject(currentUser, project) {
  return canDeleteProject(currentUser, project);
}

function canAddTask(currentUser, project) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  return [ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role) && isProjectMember(project, currentUser.id);
}

function canDeleteTask(currentUser, project, task = null) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  if (![ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role)) return false;
  if (getProjectOwnerId(project) === currentUser.id) return true;
  return !!task && task.createdBy === currentUser.id && isProjectMember(project, currentUser.id);
}

function canCompleteTask(currentUser, task) {
  return currentUser.role !== ROLES.USER && getTaskAssigneeIds(task).includes(currentUser.id);
}

function canSubmitProof(currentUser, task) {
  return getTaskAssigneeIds(task).includes(currentUser.id) && !isTaskFullyCompleted(task);
}

function canSeeTask(currentUser, task, project, users) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  const taskAssigneeIds = getTaskAssigneeIds(task);
  if (currentUser.role === ROLES.USER) return taskAssigneeIds.includes(currentUser.id);
  if ([ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role)) {
    return isProjectMember(project, currentUser.id) || taskAssigneeIds.includes(currentUser.id);
  }
  return taskAssigneeIds.includes(currentUser.id);
}

function getVisibleUsers(currentUser, users) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return users;
  if (currentUser.role === ROLES.ADMIN) return users.filter((user) => user.createdBy === currentUser.id && [ROLES.MODERATOR, ROLES.USER].includes(user.role));
  if (currentUser.role === ROLES.MODERATOR) return users.filter((user) => user.createdBy === currentUser.id && user.role === ROLES.USER);
  return users.filter((user) => user.id === currentUser.id);
}

function getTeamUsers(currentUser, users) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return users;
  if ([ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role)) {
    return users.filter((user) => user.id === currentUser.id || user.createdBy === currentUser.id);
  }
  return users.filter((user) => user.id === currentUser.id);
}

function getAssignableUsers(currentUser, users) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return users;
  return users.filter((user) => canAssignUser(currentUser, user));
}

function getTaskAssignableUsers(currentUser, users) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return users;
  return users.filter((user) => canAssignUser(currentUser, user));
}

function getVisibleProjects(currentUser, projects, users) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return projects;
  if ([ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role)) {
    return projects.filter((project) => isProjectMember(project, currentUser.id));
  }
  return projects.filter((project) => getProjectAssigneeIds(project).includes(currentUser.id) || project.tasks.some((task) => getTaskAssigneeIds(task).includes(currentUser.id)));
}


function getRoleRank(role) {
  const ranks = {
    [ROLES.USER]: 1,
    [ROLES.MODERATOR]: 2,
    [ROLES.ADMIN]: 3,
    [ROLES.SUPER_ADMIN]: 4
  };
  return ranks[role] || 0;
}

function canSeeActorActivity(currentUser, actorUser) {
  if (!actorUser) return currentUser.role === ROLES.SUPER_ADMIN;
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  if (actorUser.id === currentUser.id) return true;
  return getRoleRank(actorUser.role) < getRoleRank(currentUser.role);
}

function canSeeActivityLog(currentUser, users, log, visibleProjectIds) {
  if (!currentUser || !log || typeof log !== "object") return false;
  const actorUser = users.find((user) => user.id === log.userId);
  if (!canSeeActorActivity(currentUser, actorUser)) return false;
  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  if (log.projectId) return visibleProjectIds.has(log.projectId) || log.userId === currentUser.id;
  if (log.userId === currentUser.id) return true;
  return !!actorUser && getVisibleUsers(currentUser, users).some((user) => user.id === actorUser.id);
}

function getVisibleTasks(currentUser, projects, users) {
  return getVisibleProjects(currentUser, projects, users).flatMap((project) =>
    project.tasks
      .filter((task) => canSeeTask(currentUser, task, project, users))
      .map((task) => ({ ...task, projectId: project.id, projectTitle: project.title }))
  );
}

function getVisibleOverdueItems(currentUser, projects, users) {
  const visibleProjects = getVisibleProjects(currentUser, projects, users);
  const overdueProjects = visibleProjects.filter((project) => getProjectProgress(project) < 100 && isPastDeadline(project.deadlineAt));
  const overdueTasks = getVisibleTasks(currentUser, projects, users).filter((task) => !isTaskFullyCompleted(task) && isPastDeadline(task.deadlineAt));
  return { overdueProjects, overdueTasks, total: overdueProjects.length + overdueTasks.length };
}


function getProjectStatusLabel(project) {
  const explicit = project.status;
  if (explicit === "draft") return "Draft";
  if (explicit === "review") return "Dalam Review";
  if (explicit === "completed") return "Selesai";
  if (getProjectStatus(project) === "overdue") return "Lewat Deadline";
  if (getProjectStatus(project) === "completed") return "Selesai";
  return "Berjalan";
}

function getTaskStatusKey(task) {
  if (isTaskFullyCompleted(task)) return "verified";
  const latest = getLatestSubmission(task);
  if (latest?.status === "submitted") return "review";
  if (latest?.status === "rejected") return "rejected";
  if (isPastDeadline(task.deadlineAt)) return "overdue";
  return "open";
}

function getUserWorkSummary(user, projects) {
  const ownedProjects = projects.filter((project) => getProjectOwnerId(project) === user.id);
  const memberProjects = projects.filter((project) => isProjectMember(project, user.id));
  const assignedTasks = projects.flatMap((project) => (project.tasks || [])
    .filter((task) => getTaskAssigneeIds(task).includes(user.id))
    .map((task) => ({ project, task })));
  const createdTasks = projects.flatMap((project) => (project.tasks || [])
    .filter((task) => task.createdBy === user.id)
    .map((task) => ({ project, task })));
  const verifiedTasks = assignedTasks.filter(({ task }) => isTaskFullyCompleted(task));
  const reviewTasks = assignedTasks.filter(({ task }) => getTaskStatusKey(task) === "review");
  const overdueTasks = assignedTasks.filter(({ task }) => !isTaskFullyCompleted(task) && isPastDeadline(task.deadlineAt));
  const progress = assignedTasks.length ? Math.round((verifiedTasks.length / assignedTasks.length) * 100) : 0;
  return { ownedProjects, memberProjects, assignedTasks, createdTasks, verifiedTasks, reviewTasks, overdueTasks, progress };
}

function getActivityTone(action = "") {
  const value = action.toLowerCase();
  if (value.includes("hapus") || value.includes("tolak") || value.includes("reject")) return "red";
  if (value.includes("submit") || value.includes("review") || value.includes("deadline")) return "yellow";
  if (value.includes("verified") || value.includes("diverifikasi") || value.includes("selesai")) return "green";
  return "blue";
}

function EmptyProfessionalState({ icon = "project", title = "Belum ada data", description = "Data akan muncul setelah aktivitas dibuat.", action }) {
  return <div className="pro-empty-state"><Icon name={icon} /><strong>{title}</strong><p>{description}</p>{action}</div>;
}

function getVisibleTaskUnits(currentUser, projects, users) {
  return getVisibleProjects(currentUser, projects, users).flatMap((project) =>
    project.tasks.flatMap((task) => {
      let assigneeIds = getTaskAssigneeIds(task);
      if ([ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role)) {
        const allowedIds = [currentUser.id, ...getSubordinateIds(currentUser, users)];
        assigneeIds = assigneeIds.filter((id) => allowedIds.includes(id));
      }
      if (currentUser.role === ROLES.USER) assigneeIds = assigneeIds.filter((id) => id === currentUser.id);
      return assigneeIds.map((userId) => ({ project, task, userId, isCompleted: isTaskCompletedBy(task, userId) }));
    })
  );
}

function Icon({ name, className = "" }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    project: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <path d="M8 13h8" />
      </>
    ),
    tasks: (
      <>
        <path d="M9 11l2 2 4-4" />
        <path d="M21 12a9 9 0 1 1-5.3-8.2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </>
    ),
    lamp: (
      <>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />
        <path d="M10 9h4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    upload: (
      <>
        <path d="M12 21V9" />
        <path d="m7 14 5-5 5 5" />
        <path d="M5 3h14" />
      </>
    ),
    refresh: (
      <>
        <path d="M21 12a9 9 0 0 1-15.5 6.2" />
        <path d="M3 12A9 9 0 0 1 18.5 5.8" />
        <path d="M18 2v4h-4" />
        <path d="M6 22v-4h4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 15 4-4 3 3 5-7" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 15H6L5 6" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7" />
        <path d="M10 14 21 3" />
        <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    )
  };

  return (
    <svg className={`app-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] || paths.project}
    </svg>
  );
}

function Badge({ role, children }) {
  const colors = {
    SUPER_ADMIN: "role-badge role-super",
    ADMIN: "role-badge role-admin",
    MODERATOR: "role-badge role-moderator",
    USER: "role-badge role-user"
  };
  return <span className={colors[role] || "role-badge role-neutral"}>{children || roleLabel(role)}</span>;
}

function StatusPill({ state }) {
  const iconName = state.tone === "danger" ? "alert" : state.tone === "done" ? "check" : "clock";
  return (
    <span className={`status-pill status-${state.tone}`}>
      <Icon name={iconName} className="pill-icon" />
      {state.label}
    </span>
  );
}

function DeadlineLine({ value, state }) {
  return (
    <p className={`deadline-line deadline-${state.tone}`}>
      <Icon name="clock" className="line-icon" />
      <span className="font-bold">Deadline:</span> {formatDate(value)} <StatusPill state={state} />
    </p>
  );
}

function ProgressBar({ value, tone = "active" }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`progress-fill progress-${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PageHeader({ title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <p className="page-kicker">ITI Workspace</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className={`page-action ${action ? "" : "is-empty"}`} aria-hidden={!action}>
        {action || <span />}
      </div>
    </div>
  );
}

function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).slice(Math.max(0, page - 3), Math.max(5, page + 2));

  if (total <= pageSize && !onPageSizeChange) return null;

  return (
    <div className="pagination-row">
      <div className="pagination-info">
        {total ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} dari ${total}` : "0 data"}
      </div>
      <div className="pagination-buttons">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</button>
        {pages.map((item) => (
          <button key={item} className={item === page ? "active" : ""} onClick={() => onPageChange(item)}>
            {item}
          </button>
        ))}
        <button disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

function ExportActions({ onCsv, onPdf }) {
  return (
    <div className="export-actions">
      <button className="ghost-action" onClick={onCsv}>Export CSV</button>
      <button className="ghost-action" onClick={onPdf}>Export PDF</button>
    </div>
  );
}

function ToastStack({ toasts, dismissToast }) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <button key={toast.id} className={`toast toast-${toast.tone}`} onClick={() => dismissToast(toast.id)}>
          <strong>{toast.title}</strong>
          {toast.message && <span>{toast.message}</span>}
        </button>
      ))}
    </div>
  );
}

function PermissionMatrix() {
  const rows = [
    ["Membuat Admin", "Ya", "Tidak", "Tidak", "Tidak"],
    ["Membuat Moderator", "Ya", "Ya", "Tidak", "Tidak"],
    ["Membuat User", "Ya", "Ya", "Ya", "Tidak"],
    ["Membuat Project", "Ya", "Ya", "Ya", "Tidak"],
    ["Assign ke Super Admin", "Ya", "Tidak", "Tidak", "Tidak"],
    ["Assign ke Admin", "Ya", "Tidak", "Tidak", "Tidak"],
    ["Assign ke Moderator bawahan", "Ya", "Ya", "Tidak", "Tidak"],
    ["Assign ke User bawahan", "Ya", "Ya", "Ya", "Tidak"],
    ["Mengirim bukti task sendiri", "Ya", "Ya", "Ya", "Ya"]
  ];
  return (
    <div className="work-panel permission-matrix">
      <div className="panel-heading">
        <div>
          <p>Permission Matrix</p>
          <h2>Hak Akses Role</h2>
        </div>
      </div>
      <div className="matrix-table">
        <div className="matrix-head"><span>Akses</span><span>Super Admin</span><span>Admin</span><span>Moderator</span><span>User</span></div>
        {rows.map((row) => (
          <div key={row[0]} className="matrix-row">{row.map((cell) => <span key={cell}>{cell}</span>)}</div>
        ))}
      </div>
    </div>
  );
}

function Header({ users, currentUser, setCurrentUserId, resetDemoData, darkMode, setDarkMode, searchQuery, setSearchQuery, backupData, restoreData, followUpTasks = [], openProject }) {
  const restoreInputRef = useRef(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileHeaderOpen, setIsMobileHeaderOpen] = useState(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const nextCompact = window.scrollY > 72;
      setIsHeaderCompact(nextCompact);
      if (!nextCompact) setIsMobileHeaderOpen(false);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`app-topbar ${isHeaderCompact ? "is-compact" : ""} ${isMobileHeaderOpen ? "is-menu-open" : ""}`}>
      <div className={`topbar-search ${isSearchOpen ? "is-open" : ""}`}>
        <button type="button" className="topbar-icon-button" aria-label="Cari" onClick={() => setIsSearchOpen((value) => !value)}>
          <Icon name="search" />
        </button>
        {isSearchOpen && <input autoFocus aria-label="Search" placeholder="Cari project, task, user, deadline..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />}
        {isSearchOpen && searchQuery && (
          <button type="button" className="search-clear" onClick={() => setSearchQuery("")} aria-label="Bersihkan pencarian">
            ×
          </button>
        )}
      </div>
      <button type="button" className="mobile-header-toggle" aria-label="Buka menu header" onClick={() => setIsMobileHeaderOpen((value) => !value)}>
        <Icon name="dashboard" />
      </button>
      <div className="topbar-controls topbar-cluster">
        <div className="online-user" title={`${currentUser.name} sedang login`}>
          <span className="online-avatar">{currentUser.name.slice(0, 1)}</span>
        </div>
        <div className="user-switcher">
          <label>User Aktif</label>
          <select value={currentUser.id} onChange={(event) => setCurrentUserId(event.target.value)}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="role-pill">
          <Badge role={currentUser.role} />
        </div>
        <button className="ghost-action" onClick={resetDemoData}>
          <Icon name="refresh" />
          Reset Demo
        </button>
        <button className="icon-only-action" title="Backup" aria-label="Backup" onClick={backupData}>
          <Icon name="download" />
        </button>
        <button className="icon-only-action" title="Restore" aria-label="Restore" onClick={() => restoreInputRef.current?.click()}>
          <Icon name="upload" />
        </button>
        <button className={`theme-toggle ${darkMode ? "is-on" : ""}`} title={darkMode ? "Mode terang" : "Mode gelap"} aria-label={darkMode ? "Mode terang" : "Mode gelap"} onClick={() => setDarkMode((value) => !value)}>
          <Icon name="lamp" />
        </button>
        <div className="notification-menu">
          <button className="notification-button" title="Notifikasi deadline" aria-label="Notifikasi deadline" onClick={() => setIsNotificationOpen((value) => !value)}>
            <Icon name="bell" />
            {!!followUpTasks.length && <span>{followUpTasks.length}</span>}
          </button>
          {isNotificationOpen && (
            <div className="notification-panel">
              <div className="notification-head">
                <strong>Follow Up Deadline</strong>
                <small>{followUpTasks.length} task</small>
              </div>
              <div className="notification-list">
                {followUpTasks.map((task) => (
                  <button key={`${task.projectId}_${task.id}`} onClick={() => {
                    setIsNotificationOpen(false);
                    openProject?.(task.projectId);
                  }}>
                    <strong>{task.title}</strong>
                    <span>{task.projectTitle}</span>
                    <small>{formatDate(task.deadlineAt)}</small>
                  </button>
                ))}
                {!followUpTasks.length && <p>Tidak ada deadline dekat.</p>}
              </div>
            </div>
          )}
        </div>
        <input ref={restoreInputRef} className="hidden" type="file" accept="application/json" onChange={(event) => {
          restoreData(event.target.files?.[0]);
          event.target.value = "";
        }} />
      </div>
    </header>
  );
}

function Sidebar({ activePage, setActivePage, currentUser }) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const tabs = [
    ["dashboard", "Dashboard", "Ringkasan kerja", "dashboard"],
    ...(currentUser.role !== ROLES.USER ? [["users", "Pengguna", "Kelola akses", "users"]] : []),
    ["projects", "Project", "Daftar project", "project"],
    ...(currentUser.role !== ROLES.USER ? [["archives", "Arsip", "Project selesai", "file"]] : []),
    ["tasks", "Tugas Saya", "Pekerjaan aktif", "tasks"]
  ];
  const primaryTabs = tabs.filter(([id]) => ["dashboard", "projects", "tasks"].includes(id));
  const drawerTabs = tabs.filter(([id]) => !["dashboard", "projects", "tasks"].includes(id));
  const openTab = (id) => {
    setActivePage(id);
    setIsMobileDrawerOpen(false);
  };

  return (
    <aside className="app-sidebar">
      {isMobileDrawerOpen && (
        <button className="mobile-drawer-backdrop" aria-label="Tutup menu" onClick={() => setIsMobileDrawerOpen(false)} />
      )}
      <div className="sidebar-panel">
        <div className="sidebar-intro">
          <div className="sidebar-logo">ITI</div>
          <div>
            <span>Workspace</span>
            <strong>ITI Task</strong>
          </div>
        </div>
        <nav className="desktop-nav">
          {tabs.map(([id, label, hint, icon]) => (
            <button key={id} className={`nav-item ${activePage === id ? "active" : ""}`} onClick={() => openTab(id)}>
              <span className="nav-icon"><Icon name={icon} /></span>
              <span>
                <strong>{label}</strong>
                <small>{hint}</small>
              </span>
            </button>
          ))}
        </nav>
        <nav className="mobile-nav">
          {primaryTabs.map(([id, label, hint, icon]) => (
            <button key={id} className={`nav-item ${activePage === id ? "active" : ""}`} onClick={() => openTab(id)}>
              <span className="nav-icon"><Icon name={icon} /></span>
              <span>
                <strong>{label}</strong>
                <small>{hint}</small>
              </span>
            </button>
          ))}
          <button className={`nav-item ${drawerTabs.some(([id]) => id === activePage) || isMobileDrawerOpen ? "active" : ""}`} onClick={() => setIsMobileDrawerOpen((value) => !value)}>
            <span className="nav-icon"><Icon name="menu" /></span>
            <span>
              <strong>Menu</strong>
              <small>Lainnya</small>
            </span>
          </button>
        </nav>
      </div>
      <div className={`mobile-drawer ${isMobileDrawerOpen ? "open" : ""}`}>
        <div className="mobile-drawer-handle" />
        <p>Menu Lainnya</p>
        {drawerTabs.map(([id, label, hint, icon]) => (
          <button key={id} className={`drawer-item ${activePage === id ? "active" : ""}`} onClick={() => openTab(id)}>
            <span className="nav-icon"><Icon name={icon} /></span>
            <span>
              <strong>{label}</strong>
              <small>{hint}</small>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function Dashboard({ currentUser, users, projects, openProject, onSummaryOpen, searchQuery, activityLogs, archivedProjectIds = [] }) {
  const [insightView, setInsightView] = useState(null);
  const visibleProjects = useMemo(
    () => getVisibleProjects(currentUser, projects, users)
      .filter((project) => !archivedProjectIds.includes(project.id))
      .filter((project) => projectMatchesSearch(project, users, searchQuery)),
    [currentUser, projects, users, searchQuery, archivedProjectIds]
  );
  const taskUnits = useMemo(() =>
    visibleProjects.flatMap((project) =>
      project.tasks.flatMap((task) => {
        let assigneeIds = getTaskAssigneeIds(task);
        if ([ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role)) {
          const allowedIds = [currentUser.id, ...getSubordinateIds(currentUser, users)];
          assigneeIds = assigneeIds.filter((id) => allowedIds.includes(id));
        }
        if (currentUser.role === ROLES.USER) assigneeIds = assigneeIds.filter((id) => id === currentUser.id);
        return assigneeIds.map((userId) => ({ project, task, userId, isCompleted: isTaskCompletedBy(task, userId) }));
      })
    ),
    [visibleProjects, currentUser, users]
  );
  const overdueItems = useMemo(() => {
    const overdueProjects = visibleProjects.filter((project) => getProjectProgress(project) < 100 && isPastDeadline(project.deadlineAt));
    const overdueTasks = visibleProjects.flatMap((project) => project.tasks.map((task) => ({ ...task, projectId: project.id }))).filter((task) => !isTaskFullyCompleted(task) && isPastDeadline(task.deadlineAt));
    return { overdueProjects, overdueTasks, total: overdueProjects.length + overdueTasks.length };
  }, [visibleProjects]);
  const progressUsers = useMemo(() => getTeamUsers(currentUser, users), [currentUser, users]);
  const projectById = useMemo(() => new Map(visibleProjects.map((project) => [project.id, project])), [visibleProjects]);
  const visibleTasks = useMemo(
    () => getVisibleTasks(currentUser, visibleProjects, users).filter((task) => {
      const project = projectById.get(task.projectId);
      return project ? taskMatchesSearch(task, project, users, searchQuery) : includesSearch(task.title, searchQuery);
    }),
    [currentUser, visibleProjects, users, searchQuery, projectById]
  );
  const avgProgress = visibleProjects.length ? Math.round(visibleProjects.reduce((sum, project) => sum + getProjectProgress(project), 0) / visibleProjects.length) : 0;
  const timeline = useMemo(() => getProjectActivityTimeline(visibleProjects), [visibleProjects]);
  const topProjects = useMemo(() => [...visibleProjects].sort((a, b) => getProjectProgress(b) - getProjectProgress(a)).slice(0, 4), [visibleProjects]);
  const urgentTasks = useMemo(
    () => visibleTasks
      .filter((task) => !isTaskFullyCompleted(task))
      .sort((a, b) => new Date(a.deadlineAt || "2999-12-31").getTime() - new Date(b.deadlineAt || "2999-12-31").getTime())
      .slice(0, 5),
    [visibleTasks]
  );
  const nearestTask = urgentTasks[0];
  const monthDeadlineProjectItems = visibleProjects.filter((project) => isThisMonth(project.deadlineAt));
  const projectsWithoutTaskItems = visibleProjects.filter((project) => !project.tasks.length);
  const proofWaitingTaskItems = visibleTasks.filter((task) => !isTaskFullyCompleted(task) && !(task.completionProof?.submissions || []).length);
  const staleProjectItems = visibleProjects.filter((project) => getProjectProgress(project) === 0 && project.tasks.length > 0);
  const teamLoad = progressUsers.map((user) => {
    const userTasks = visibleProjects.flatMap((project) => project.tasks.map((task) => ({ ...task, projectId: project.id, projectTitle: project.title }))).filter((task) => getTaskAssigneeIds(task).includes(user.id));
    const openTasks = userTasks.filter((task) => !isTaskCompletedBy(task, user.id)).length;
    return { user, openTasks, tasks: userTasks.filter((task) => !isTaskCompletedBy(task, user.id)) };
  }).sort((a, b) => b.openTasks - a.openTasks);
  const busiestUser = teamLoad[0];
  const canSeeTeamLoad = currentUser.role === ROLES.SUPER_ADMIN;
  const personalOpenTasks = visibleTasks.filter((task) => getTaskAssigneeIds(task).includes(currentUser.id) && !isTaskCompletedBy(task, currentUser.id));
  const followUpTasks = visibleTasks
    .filter((task) => !isTaskFullyCompleted(task) && isDueSoon(task.deadlineAt, 7))
    .sort((a, b) => new Date(a.deadlineAt || "2999-12-31").getTime() - new Date(b.deadlineAt || "2999-12-31").getTime())
    .slice(0, 6);
  const latestLog = activityLogs[0];
  const insightData = {
    priority: {
      title: "Prioritas Terdekat",
      description: "Task aktif yang paling dekat dengan deadline.",
      empty: "Tidak ada task aktif yang menunggu.",
      items: urgentTasks.map((task) => ({
        id: `${task.projectId}_${task.id}`,
        title: task.title,
        meta: task.projectTitle,
        detail: `Deadline: ${formatDate(task.deadlineAt)}`,
        projectId: task.projectId
      }))
    },
    workload: {
      title: "Progress Tim",
      description: "Klik nama user untuk melihat task terbuka yang belum dikerjakan.",
      empty: "Belum ada task terbuka.",
      items: teamLoad.map((item) => ({
        id: item.user.id,
        title: item.user.name,
        meta: roleLabel(item.user.role),
        detail: `${item.openTasks} task terbuka`,
        assigneeId: item.user.id
      }))
    },
    activity: {
      title: "Aktivitas Terakhir",
      description: "Riwayat perubahan terbaru di workspace.",
      empty: "Belum ada aktivitas.",
      items: activityLogs.slice(0, 8).map((log) => ({
        id: log.id,
        title: log.action,
        meta: getUserName(users, log.userId),
        detail: `${log.detail} - ${formatDate(log.createdAt)}`
      }))
    },
    monthDeadlines: {
      title: "Deadline Bulan Ini",
      description: "Project dengan deadline pada bulan berjalan.",
      empty: "Tidak ada project dengan deadline bulan ini.",
      items: monthDeadlineProjectItems.map((project) => ({
        id: project.id,
        title: project.title,
        meta: getProjectAssigneeNames(users, project),
        detail: `Deadline: ${formatDate(project.deadlineAt)}`,
        projectId: project.id
      }))
    },
    emptyProjects: {
      title: "Project Tanpa Task",
      description: "Project yang perlu segera dipecah menjadi task.",
      empty: "Tidak ada project tanpa task.",
      items: projectsWithoutTaskItems.map((project) => ({
        id: project.id,
        title: project.title,
        meta: getProjectAssigneeNames(users, project),
        detail: `Dibuat: ${formatDate(project.createdAt)}`,
        projectId: project.id
      }))
    },
    waitingProof: {
      title: "Menunggu Bukti",
      description: "Task terbuka yang belum memiliki submission.",
      empty: "Tidak ada task yang menunggu bukti.",
      items: proofWaitingTaskItems.map((task) => ({
        id: `${task.projectId}_${task.id}`,
        title: task.title,
        meta: task.projectTitle,
        detail: `Assignee: ${getTaskAssigneeNames(users, task)}`,
        projectId: task.projectId
      }))
    },
    staleProjects: {
      title: "Belum Bergerak",
      description: "Project yang sudah punya task tetapi progress masih 0%.",
      empty: "Tidak ada project yang belum bergerak.",
      items: staleProjectItems.map((project) => ({
        id: project.id,
        title: project.title,
        meta: getProjectAssigneeNames(users, project),
        detail: `Deadline: ${formatDate(project.deadlineAt)}`,
        projectId: project.id
      }))
    }
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-titlebar">
        <div>
          <p className="page-kicker">Project Dashboard</p>
          <h2>Dashboard</h2>
        </div>
        <p>{searchQuery ? `Hasil pencarian untuk "${searchQuery}"` : "Pantau project, deadline, dan progress tim dalam satu tampilan ringkas."}</p>
      </div>
      <SummaryMenu currentUser={currentUser} users={users} projects={projects} onSummaryOpen={onSummaryOpen} scopedProjects={visibleProjects} />
      {!!overdueItems.total && (
        <div className="deadline-alert">
          Ada {overdueItems.total} project/task yang sudah melewati deadline dan belum selesai.
        </div>
      )}
      <div className="dashboard-mytask-grid">
        <div className="work-panel trend-panel">
          <div className="panel-heading">
            <div>
              <p>Project Report</p>
              <h2>Progress Timeline</h2>
            </div>
            <span className="panel-total">{avgProgress}%</span>
          </div>
          <div className="trend-line" aria-hidden="true">
            <svg viewBox="0 0 720 160" preserveAspectRatio="none">
              <path d={timeline.path} />
              <g>
                {timeline.points.map((point) => (
                  <circle key={point.label} cx={point.x} cy={point.y} r="4" />
                ))}
              </g>
            </svg>
            <div className="trend-labels">
              {timeline.months.map((month, index) => (
                <span key={`${month.label}_${index}`}>{month.label}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="right-stack">
          <button type="button" className="insight-card insight-primary insight-button" onClick={() => setInsightView("priority")}>
            <span className="insight-icon"><Icon name="clock" /></span>
            <div>
              <p>Prioritas Terdekat</p>
              <strong>{nearestTask ? formatDate(nearestTask.deadlineAt) : "Aman"}</strong>
              <small>{nearestTask ? nearestTask.title : "Tidak ada task aktif yang menunggu."}</small>
            </div>
          </button>
          {canSeeTeamLoad && (
            <div className="split-insight-card">
              <button type="button" className="split-insight-item insight-button" onClick={() => setInsightView("workload")}>
                <span className="insight-icon"><Icon name="users" /></span>
                <span>
                  <p>Progress Tim</p>
                  <strong>{busiestUser ? busiestUser.openTasks : 0} task</strong>
                  <small>{busiestUser ? busiestUser.user.name : "Belum ada task terbuka."}</small>
                </span>
              </button>
              <button type="button" className="split-insight-item insight-button" onClick={() => onSummaryOpen("tasks", "running", { taskAssignee: currentUser.id })}>
                <span className="insight-icon"><Icon name="tasks" /></span>
                <span>
                  <p>Task Saya Aktif</p>
                  <strong>{personalOpenTasks.length} task</strong>
                  <small>Fokus pekerjaan pribadi.</small>
                </span>
              </button>
            </div>
          )}
          {!canSeeTeamLoad && (
            <button type="button" className="insight-card insight-button" onClick={() => onSummaryOpen("tasks", "running", { taskAssignee: currentUser.id })}>
              <span className="insight-icon"><Icon name="tasks" /></span>
              <div>
                <p>Task Saya Aktif</p>
                <strong>{personalOpenTasks.length} task</strong>
                <small>Fokus pekerjaan pribadi yang masih terbuka.</small>
              </div>
            </button>
          )}
          <button type="button" className="insight-card insight-button" onClick={() => setInsightView("activity")}>
            <span className="insight-icon"><Icon name="file" /></span>
            <div>
              <p>Aktivitas Terakhir</p>
              <strong>{latestLog ? latestLog.action : "Belum ada"}</strong>
              <small>{latestLog ? `${latestLog.detail} - ${getUserName(users, latestLog.userId)}` : "Aktivitas akan muncul setelah ada perubahan."}</small>
            </div>
          </button>
        </div>
      </div>
      <div className="dashboard-insight-row">
        <button type="button" className="mini-stat mini-stat-compact insight-button tone-warning" onClick={() => onSummaryOpen("projects", "all", { projectStatus: "active", projectDeadline: "month" })}>
          <span className="mini-stat-icon"><Icon name="clock" /></span>
          <span>Deadline Bulan Ini</span>
          <strong>{monthDeadlineProjectItems.length}</strong>
          <small>Project perlu dipantau bulan berjalan</small>
        </button>
        <button type="button" className="mini-stat mini-stat-compact insight-button tone-info" onClick={() => onSummaryOpen("projects", "all", { projectStatus: "empty" })}>
          <span className="mini-stat-icon"><Icon name="project" /></span>
          <span>Project Tanpa Task</span>
          <strong>{projectsWithoutTaskItems.length}</strong>
          <small>Butuh breakdown pekerjaan</small>
        </button>
        <button type="button" className="mini-stat mini-stat-compact insight-button tone-proof" onClick={() => onSummaryOpen("tasks", "waitingProof")}>
          <span className="mini-stat-icon"><Icon name="file" /></span>
          <span>Menunggu Bukti</span>
          <strong>{proofWaitingTaskItems.length}</strong>
          <small>Task terbuka tanpa submission</small>
        </button>
        <button type="button" className="mini-stat mini-stat-compact danger insight-button tone-danger" onClick={() => onSummaryOpen("projects", "all", { projectStatus: "stale" })}>
          <span className="mini-stat-icon"><Icon name="alert" /></span>
          <span>Belum Bergerak</span>
          <strong>{staleProjectItems.length}</strong>
          <small>Project bertask dengan progress 0%</small>
        </button>
      </div>
      <div className="dashboard-grid refined">
        <div className="work-panel project-performance">
          <div className="panel-heading">
            <div>
              <p>Project Performance</p>
              <h2>Progress Project</h2>
            </div>
          </div>
          <div className="project-list">
            {topProjects.map((project) => {
              const progress = getProjectProgress(project);
              const deadlineState = getDeadlineState(project.deadlineAt, progress === 100);
              const overdueTasks = getProjectOverdueTasks(project).length;
              return (
                <button key={project.id} className={`project-row compact ${deadlineState.isOverdue || overdueTasks ? "is-overdue" : ""}`} onClick={() => openProject(project.id)}>
                  <div className="project-row-main">
                    <div className={`project-dot dot-${deadlineState.tone}`} />
                    <div className="min-w-0">
                      <p className="project-title">{project.title}</p>
                      <p className="project-meta">{getProjectAssigneeNames(users, project)}</p>
                      <p className={`deadline-mini ${deadlineState.isOverdue ? "is-danger" : ""}`}>Deadline: {formatDate(project.deadlineAt)}</p>
                    </div>
                    <span className="project-percent">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} tone={deadlineState.tone} />
                </button>
              );
            })}
            {!topProjects.length && <EmptyState text="Belum ada project yang bisa dilihat." />}
          </div>
        </div>
        <div className="work-panel task-board-panel">
          <div className="panel-heading">
            <div>
              <p>Task Priority</p>
              <h2>Deadline Terdekat</h2>
            </div>
          </div>
          <div className="deadline-list">
            {urgentTasks.map((task) => {
              const deadlineState = getDeadlineState(task.deadlineAt, isTaskFullyCompleted(task));
              return (
                <button key={`${task.projectId}_${task.id}`} className={`deadline-item deadline-item-${deadlineState.tone}`} onClick={() => openProject(task.projectId)}>
                  <div>
                    <p>{task.title}</p>
                    <span>{task.projectTitle}</span>
                    <small className={`deadline-mini ${deadlineState.isOverdue ? "is-danger" : ""}`}>Deadline: {formatDate(task.deadlineAt)}</small>
                  </div>
                  <StatusPill state={deadlineState} />
                </button>
              );
            })}
            {!urgentTasks.length && <EmptyState text="Tidak ada task aktif." />}
          </div>
        </div>
      </div>
      <div className="work-panel team-overview">
        <div className="panel-heading">
          <div>
            <p>Team Overview</p>
            <h2>Progress User</h2>
          </div>
        </div>
        <div className="team-grid">
          {progressUsers.map((user) => {
            const userTasks = projects.flatMap((project) => project.tasks).filter((task) => getTaskAssigneeIds(task).includes(user.id));
            const userCompleted = userTasks.filter((task) => isTaskCompletedBy(task, user.id)).length;
            const progress = userTasks.length ? Math.round((userCompleted / userTasks.length) * 100) : 0;
            return (
              <div key={user.id} className="team-card">
                <div className="user-avatar">{user.name.slice(0, 1)}</div>
                <div className="min-w-0 flex-1">
                  <div className="progress-row-top">
                    <div>
                      <p className="user-name">{user.name}</p>
                      <p className="user-meta">{userCompleted}/{userTasks.length} task selesai</p>
                    </div>
                    <Badge role={user.role} />
                  </div>
                  <ProgressBar value={progress} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="work-panel">
        <div className="panel-heading">
          <div>
            <p>Activity Log</p>
            <h2>Aktivitas Terbaru</h2>
          </div>
        </div>
        <div className="activity-list">
          {activityLogs.slice(0, 8).map((log) => (
            <div key={log.id} className="activity-row">
              <span>{log.action}</span>
              <p>{log.detail}</p>
              <small>{getUserName(users, log.userId)} - {formatDate(log.createdAt)}</small>
            </div>
          ))}
          {!activityLogs.length && <EmptyState text="Belum ada aktivitas." />}
        </div>
      </div>
      {insightView && (
        <DashboardInsightModal
          data={insightData[insightView]}
          close={() => setInsightView(null)}
          openProject={(projectId) => {
            setInsightView(null);
            openProject(projectId);
          }}
          openAssigneeTasks={(assigneeId) => {
            setInsightView(null);
            onSummaryOpen("tasks", "assigneePending", { taskAssignee: assigneeId });
          }}
        />
      )}
    </section>
  );
}

function DashboardInsightModal({ data, close, openProject, openAssigneeTasks }) {
  if (!data) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-3xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <p className="page-kicker">Dashboard Insight</p>
            <h2 className="text-2xl font-black text-slate-950">{data.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{data.description}</p>
          </div>
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-100" onClick={close}>
            Tutup
          </button>
        </div>
        <div className="insight-modal-list p-5">
          {data.items.map((item) => {
            const content = (
              <>
                <span className="insight-modal-icon"><Icon name={item.projectId ? "project" : item.assigneeId ? "users" : "file"} /></span>
                <span className="min-w-0">
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                  <em>{item.detail}</em>
                </span>
              </>
            );
            return item.projectId ? (
              <button key={item.id} className="insight-modal-row" onClick={() => openProject(item.projectId)}>
                {content}
              </button>
            ) : item.assigneeId ? (
              <button key={item.id} className="insight-modal-row" onClick={() => openAssigneeTasks(item.assigneeId)}>
                {content}
              </button>
            ) : (
              <div key={item.id} className="insight-modal-row">
                {content}
              </div>
            );
          })}
          {!data.items.length && <EmptyState text={data.empty} />}
        </div>
      </div>
    </div>
  );
}

function SummaryMenu({ currentUser, users, projects, onSummaryOpen, scopedProjects }) {
  const visibleProjects = scopedProjects || getVisibleProjects(currentUser, projects, users);
  const taskUnits = visibleProjects.flatMap((project) =>
    project.tasks.flatMap((task) => {
      let assigneeIds = getTaskAssigneeIds(task);
      if ([ROLES.ADMIN, ROLES.MODERATOR].includes(currentUser.role)) {
        const allowedIds = [currentUser.id, ...getSubordinateIds(currentUser, users)];
        assigneeIds = assigneeIds.filter((id) => allowedIds.includes(id));
      }
      if (currentUser.role === ROLES.USER) assigneeIds = assigneeIds.filter((id) => id === currentUser.id);
      return assigneeIds.map((userId) => ({ project, task, userId, isCompleted: isTaskCompletedBy(task, userId) }));
    })
  );
  const completed = taskUnits.filter((unit) => unit.isCompleted).length;
  const overdueItems = {
    overdueProjects: visibleProjects.filter((project) => getProjectProgress(project) < 100 && isPastDeadline(project.deadlineAt)),
    overdueTasks: visibleProjects.flatMap((project) => project.tasks.map((task) => ({ ...task, projectId: project.id }))).filter((task) => !isTaskFullyCompleted(task) && isPastDeadline(task.deadlineAt))
  };
  overdueItems.total = overdueItems.overdueProjects.length + overdueItems.overdueTasks.length;
  const avgProgress = visibleProjects.length ? Math.round(visibleProjects.reduce((sum, project) => sum + getProjectProgress(project), 0) / visibleProjects.length) : 0;

  return (
    <div className="summary-grid">
      <SummaryCard label="Total Project" value={visibleProjects.length} tone="project" onClick={() => onSummaryOpen("projects", "all", { projectStatus: "active" })} />
      <SummaryCard label="Total Task" value={taskUnits.length} tone="task" onClick={() => onSummaryOpen("tasks", "all")} />
      <SummaryCard label="Selesai" value={completed} tone="done" onClick={() => onSummaryOpen("tasks", "completed")} />
      <SummaryCard label="Belum Selesai" value={taskUnits.length - completed} tone="pending" onClick={() => onSummaryOpen("tasks", "active")} />
      <SummaryCard label="Lewat Deadline" value={overdueItems.total} tone="danger" onClick={() => onSummaryOpen("deadlines")} />
      <SummaryCard label="Rata-rata Progress" value={`${avgProgress}%`} tone="progress" onClick={() => onSummaryOpen("projects", "all", { projectStatus: "active", projectSort: "progress_desc" })} />
    </div>
  );
}

function SummaryCard({ label, value, tone = "project", onClick }) {
  const iconMap = {
    project: "project",
    task: "tasks",
    done: "check",
    pending: "clock",
    danger: "alert",
    progress: "chart"
  };

  return (
    <button type="button" className={`summary-card summary-${tone}`} onClick={onClick}>
      <div className="summary-icon"><Icon name={iconMap[tone] || "project"} /></div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </button>
  );
}

function InsightQuickNav({ active, onSummaryOpen }) {
  const items = [
    {
      id: "monthDeadlines",
      label: "Deadline Bulan Ini",
      icon: "clock",
      tone: "warning",
      open: () => onSummaryOpen("projects", "all", { projectStatus: "active", projectDeadline: "month" })
    },
    {
      id: "emptyProjects",
      label: "Project Tanpa Task",
      icon: "project",
      tone: "info",
      open: () => onSummaryOpen("projects", "all", { projectStatus: "empty" })
    },
    {
      id: "waitingProof",
      label: "Menunggu Bukti",
      icon: "file",
      tone: "proof",
      open: () => onSummaryOpen("tasks", "waitingProof")
    },
    {
      id: "staleProjects",
      label: "Belum Bergerak",
      icon: "alert",
      tone: "danger",
      open: () => onSummaryOpen("projects", "all", { projectStatus: "stale" })
    }
  ];

  return (
    <div className="insight-quick-nav">
      {items.map((item) => (
        <button key={item.id} type="button" className={`insight-nav-chip tone-${item.tone} ${active === item.id ? "active" : ""}`} onClick={item.open}>
          <span><Icon name={item.icon} /></span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function UsersPage({ currentUser, users, setUsers, setProjects, searchQuery, showToast }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES.USER);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", role: ROLES.USER });
  const visibleUsers = getVisibleUsers(currentUser, users).filter((user) => userMatchesSearch(user, users, searchQuery));
  const creatableRoles = getCreatableRoles(currentUser);

  useEffect(() => {
    if (creatableRoles.length && !creatableRoles.includes(role)) {
      setRole(creatableRoles[0]);
    }
  }, [creatableRoles, role]);

  function addUser(event) {
    event.preventDefault();
    if (!name.trim()) return alert("Nama pengguna wajib diisi.");
    if (!canCreateRole(currentUser, role)) return alert(`${roleLabel(currentUser.role)} tidak dapat membuat role ${roleLabel(role)}.`);
    const newUser = { id: makeId("u"), name: name.trim(), role, createdBy: currentUser.id };
    setUsers((list) => [...list, newUser]);
    setName("");
    setRole(creatableRoles[0] || ROLES.USER);
    showToast("Pengguna disimpan", `${newUser.name} berhasil ditambahkan.`);
  }

  function deleteUser(targetUser) {
    if (!canDeleteUser(currentUser, targetUser, users)) return;
    if (!confirmAction(`Hapus pengguna "${targetUser.name}"?`)) return;
    setUsers((list) => list.filter((user) => user.id !== targetUser.id));
    setProjects((list) =>
      list.map((project) => ({
        ...project,
        assignedTo: getProjectAssigneeIds(project).filter((id) => id !== targetUser.id).length
          ? getProjectAssigneeIds(project).filter((id) => id !== targetUser.id)
          : [currentUser.id],
        tasks: project.tasks.map((task) => ({
          ...task,
          assignedTo: getTaskAssigneeIds(task).filter((id) => id !== targetUser.id).length
            ? getTaskAssigneeIds(task).filter((id) => id !== targetUser.id)
            : [currentUser.id]
        }))
      }))
    );
    showToast("Pengguna dihapus", targetUser.name, "danger");
  }

  function changeRole(targetUser, nextRole) {
    if (!canChangeRole(currentUser)) return;
    if (targetUser.role === ROLES.SUPER_ADMIN && nextRole !== ROLES.SUPER_ADMIN && users.filter((user) => user.role === ROLES.SUPER_ADMIN).length <= 1) {
      alert("Tidak dapat mengubah role SUPER ADMIN terakhir.");
      return;
    }
    setUsers((list) => list.map((user) => (user.id === targetUser.id ? { ...user, role: nextRole } : user)));
  }

  function startEditUser(user) {
    setEditingUserId(user.id);
    setEditUserForm({ name: user.name, role: user.role });
  }

  function saveEditUser(user) {
    if (!editUserForm.name.trim()) return alert("Nama pengguna wajib diisi.");
    setUsers((list) => list.map((item) => item.id === user.id ? { ...item, name: editUserForm.name.trim(), role: canChangeRole(currentUser) ? editUserForm.role : item.role } : item));
    setEditingUserId(null);
    showToast("Pengguna diperbarui", editUserForm.name.trim());
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Pengguna" description="Tambah user, ubah role, dan kelola akses sesuai permission role aktif." />
      {canCreateUser(currentUser) && !!creatableRoles.length && (
        <form className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={addUser}>
          <h2 className="mb-4 text-lg font-black text-slate-950">Tambah Pengguna</h2>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Nama pengguna" value={name} onChange={(event) => setName(event.target.value)} />
            <select className="rounded-lg border border-slate-300 px-3 py-2" value={role} onChange={(event) => setRole(event.target.value)}>
              {creatableRoles.map((item) => (
                <option key={item} value={item}>{roleLabel(item)}</option>
              ))}
            </select>
            <button className="rounded-lg bg-cyan-700 px-4 py-2 font-bold text-white hover:bg-cyan-800">Simpan</button>
          </div>
        </form>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 p-4 text-xs font-black uppercase text-slate-500">
          <span className="col-span-4">Nama</span>
          <span className="col-span-3">Role</span>
          <span className="col-span-3">Dibuat Oleh</span>
          <span className="col-span-2 text-right">Aksi</span>
        </div>
        {visibleUsers.map((user) => (
          <div key={user.id} className="grid grid-cols-12 items-center gap-3 border-b border-slate-100 p-4 last:border-0">
            <span className="col-span-4 font-bold text-slate-900">
              {editingUserId === user.id ? <input className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" value={editUserForm.name} onChange={(event) => setEditUserForm({ ...editUserForm, name: event.target.value })} /> : user.name}
            </span>
            <div className="col-span-3">
              {editingUserId === user.id && canChangeRole(currentUser) ? (
                <select className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" value={editUserForm.role} onChange={(event) => setEditUserForm({ ...editUserForm, role: event.target.value })}>
                  <option value={ROLES.SUPER_ADMIN}>SUPER ADMIN</option>
                  <option value={ROLES.ADMIN}>ADMIN</option>
                  <option value={ROLES.MODERATOR}>MODERATOR</option>
                  <option value={ROLES.USER}>USER</option>
                </select>
              ) : canChangeRole(currentUser) ? (
                <select className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" value={user.role} onChange={(event) => changeRole(user, event.target.value)}>
                  <option value={ROLES.SUPER_ADMIN}>SUPER ADMIN</option>
                  <option value={ROLES.ADMIN}>ADMIN</option>
                  <option value={ROLES.MODERATOR}>MODERATOR</option>
                  <option value={ROLES.USER}>USER</option>
                </select>
              ) : (
                <Badge role={user.role} />
              )}
            </div>
            <span className="col-span-3 text-sm text-slate-500">{user.createdBy ? getUserName(users, user.createdBy) : "-"}</span>
            <div className="col-span-2 flex justify-end gap-2">
              {editingUserId === user.id ? (
                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold" onClick={() => saveEditUser(user)}>Simpan</button>
              ) : (
                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold" onClick={() => startEditUser(user)}>Edit</button>
              )}
              <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-40" disabled={!canDeleteUser(currentUser, user, users)} onClick={() => deleteUser(user)}>
                Hapus
              </button>
            </div>
          </div>
        ))}
        {!visibleUsers.length && <div className="p-6 text-center text-sm font-bold text-slate-500">Tidak ada pengguna yang cocok.</div>}
      </div>
      {currentUser.role === ROLES.SUPER_ADMIN && <PermissionMatrix />}
    </section>
  );
}

function ProjectsPage({ currentUser, users, projects, setProjects, openProject, onSummaryOpen, searchQuery, archivedProjectIds, setArchivedProjectIds, logActivity, showToast, initialStatus = "active", initialSort = "newest", initialDeadline = "all" }) {
  const [form, setForm] = useState({ title: "", description: "", assignedTo: [], deadlineAt: "" });
  const [isProjectAssigneeOpen, setIsProjectAssigneeOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PROJECT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [sortBy, setSortBy] = useState(initialSort);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectForm, setEditProjectForm] = useState({ title: "", description: "", deadlineAt: "" });
  const projectAssigneeRef = useRef(null);
  const visibleProjects = useMemo(
    () => sortProjects(
      getVisibleProjects(currentUser, projects, users)
        .filter((project) => statusFilter === "archived" ? archivedProjectIds.includes(project.id) : !archivedProjectIds.includes(project.id))
        .filter((project) => {
          if (["all", "active", "archived"].includes(statusFilter)) return true;
          if (statusFilter === "empty") return project.tasks.length === 0;
          if (statusFilter === "stale") return getProjectProgress(project) === 0 && project.tasks.length > 0;
          return getProjectStatus(project) === statusFilter;
        })
        .filter((project) => assigneeFilter === "all" || getProjectAssigneeIds(project).includes(assigneeFilter))
        .filter((project) => deadlineFilter === "all" || (deadlineFilter === "month" && isThisMonth(project.deadlineAt)) || (deadlineFilter === "overdue" && getProjectStatus(project) === "overdue"))
        .filter((project) => projectMatchesSearch(project, users, searchQuery)),
      sortBy
    ),
    [currentUser, projects, users, searchQuery, archivedProjectIds, statusFilter, assigneeFilter, deadlineFilter, sortBy]
  );
  const visibleProjectSlice = visibleProjects.slice((page - 1) * pageSize, page * pageSize);
  const assignableUsers = getAssignableUsers(currentUser, users);
  const activeInsightNav = deadlineFilter === "month" ? "monthDeadlines" : statusFilter === "empty" ? "emptyProjects" : statusFilter === "stale" ? "staleProjects" : null;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, currentUser.id, statusFilter, assigneeFilter, deadlineFilter, sortBy, pageSize]);

  useEffect(() => {
    setStatusFilter(initialStatus);
    setSortBy(initialSort);
    setDeadlineFilter(initialDeadline);
  }, [initialStatus, initialSort, initialDeadline]);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (projectAssigneeRef.current && !projectAssigneeRef.current.contains(event.target)) {
        setIsProjectAssigneeOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function toggleProjectAssignee(userId) {
    setForm((current) => ({
      ...current,
      assignedTo: current.assignedTo.includes(userId) ? current.assignedTo.filter((id) => id !== userId) : [...current.assignedTo, userId]
    }));
  }

  function addProject(event) {
    event.preventDefault();
    const allowedAssigneeIds = new Set(assignableUsers.map((user) => user.id));
    const assignedTo = form.assignedTo.filter((id) => allowedAssigneeIds.has(id));
    if (!form.title.trim()) return alert("Project title wajib diisi.");
    if (!assignedTo.length) return alert("Assigned user wajib diisi.");
    if (!form.deadlineAt) return alert("Tanggal deadline wajib diisi.");
    setProjects((list) => [
      {
        id: makeId("p"),
        title: form.title.trim(),
        description: form.description.trim(),
        createdBy: currentUser.id,
        assignedTo,
        createdAt: nowIso(),
        deadlineAt: form.deadlineAt,
        tasks: []
      },
      ...list
    ]);
    setForm({ title: "", description: "", assignedTo: [], deadlineAt: "" });
    setIsProjectAssigneeOpen(false);
    setIsProjectFormOpen(false);
    logActivity("Project dibuat", form.title.trim());
  }

  function toggleArchiveProject(project) {
    const isArchived = archivedProjectIds.includes(project.id);
    setArchivedProjectIds((list) => (isArchived ? list.filter((id) => id !== project.id) : [...list, project.id]));
    logActivity(isArchived ? "Project dibuka dari arsip" : "Project diarsipkan", project.title);
    showToast(isArchived ? "Project dibuka" : "Project diarsipkan", project.title);
  }

  function exportProjects(format) {
    const headers = ["Judul", "Status", "Progress", "Assignee", "Pembuat", "Dibuat", "Deadline"];
    const rows = visibleProjects.map((project) => [
      project.title,
      getProjectStatus(project),
      `${getProjectProgress(project)}%`,
      getProjectAssigneeNames(users, project),
      getUserName(users, getProjectOwnerId(project)),
      formatDate(project.createdAt),
      formatDate(project.deadlineAt)
    ]);
    if (format === "csv") exportRowsToCsv("projects.csv", headers, rows);
    else exportRowsToPdf("Export Project", headers, rows);
    logActivity(`Export project ${format.toUpperCase()}`, `${rows.length} data`);
    showToast("Export project", `${rows.length} data diproses.`);
  }

  function startEditProject(project) {
    setEditingProjectId(project.id);
    setEditProjectForm({ title: project.title, description: project.description || "", deadlineAt: project.deadlineAt || "" });
  }

  function saveEditProject(project) {
    if (!editProjectForm.title.trim()) return alert("Judul project wajib diisi.");
    const changes = [];
    if (project.title !== editProjectForm.title.trim()) changes.push(`judul: "${project.title}" -> "${editProjectForm.title.trim()}"`);
    if ((project.description || "") !== editProjectForm.description.trim()) changes.push("deskripsi diperbarui");
    if ((project.deadlineAt || "") !== editProjectForm.deadlineAt) changes.push(`deadline: ${formatDate(project.deadlineAt)} -> ${formatDate(editProjectForm.deadlineAt)}`);
    setProjects((list) => list.map((item) => item.id === project.id ? { ...item, title: editProjectForm.title.trim(), description: editProjectForm.description.trim(), deadlineAt: editProjectForm.deadlineAt } : item));
    setEditingProjectId(null);
    logActivity("Project diperbarui", `${editProjectForm.title.trim()}${changes.length ? ` (${changes.join(", ")})` : ""}`);
    showToast?.("Project diperbarui", editProjectForm.title.trim());
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Project"
        description="Kelola daftar project dalam tampilan board yang lebih ringkas dan mudah dibaca."
        action={
          canCreateProject(currentUser) && !isProjectFormOpen ? (
            <button className="primary-action" onClick={() => setIsProjectFormOpen(true)}>
              <Icon name="plus" />
              Tambah Project
            </button>
          ) : null
        }
      />
      <SummaryMenu currentUser={currentUser} users={users} projects={projects} onSummaryOpen={onSummaryOpen} />
      <InsightQuickNav active={activeInsightNav} onSummaryOpen={onSummaryOpen} />
      <div className="filter-toolbar">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="active">Aktif</option>
          <option value="all">Semua Status</option>
          <option value="running">Sedang Berjalan</option>
          <option value="completed">Selesai</option>
          <option value="overdue">Lewat Deadline</option>
          <option value="empty">Project Tanpa Task</option>
          <option value="stale">Belum Bergerak</option>
          <option value="archived">Arsip</option>
        </select>
        <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
          <option value="all">Semua Assignee</option>
          {assignableUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
        <select value={deadlineFilter} onChange={(event) => setDeadlineFilter(event.target.value)}>
          <option value="all">Semua Deadline</option>
          <option value="month">Deadline Bulan Ini</option>
          <option value="overdue">Overdue</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="deadline_asc">Deadline Terdekat</option>
          <option value="progress_desc">Progress Tertinggi</option>
          <option value="progress_asc">Progress Terendah</option>
        </select>
        <ExportActions onCsv={() => exportProjects("csv")} onPdf={() => exportProjects("pdf")} />
      </div>
      {canCreateProject(currentUser) && !isProjectFormOpen && (
        <div className="hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Project</h2>
              <p className="text-sm text-slate-500">Buat project baru, pilih tim, dan tentukan deadline.</p>
            </div>
            <button className="rounded-lg bg-cyan-700 px-4 py-2 font-bold text-white hover:bg-cyan-800" onClick={() => setIsProjectFormOpen(true)}>
              <Icon name="plus" />
              Tambah Project
            </button>
          </div>
        </div>
      )}
      {canCreateProject(currentUser) && isProjectFormOpen && (
        <form className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={addProject}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Tambah Project</h2>
              <p className="text-sm text-slate-500">Isi data utama terlebih dahulu, lalu pilih satu atau beberapa penerima.</p>
            </div>
            <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100" onClick={() => setIsProjectFormOpen(false)}>
              Batal
            </button>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_220px_auto]">
            <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Judul project" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Deskripsi" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <label className="grid gap-1 text-xs font-bold uppercase text-slate-500">
              Deadline
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm normal-case text-slate-900" type="datetime-local" value={form.deadlineAt} onChange={(event) => setForm({ ...form, deadlineAt: event.target.value })} />
            </label>
            <button className="rounded-lg bg-cyan-700 px-4 py-2 font-bold text-white hover:bg-cyan-800"><Icon name="check" />Simpan</button>
            <div className="relative lg:col-span-4" ref={projectAssigneeRef}>
              <button type="button" className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm" onClick={() => setIsProjectAssigneeOpen((value) => !value)}>
                <span className={form.assignedTo.length ? "font-bold text-slate-800" : "text-slate-500"}>
                  {form.assignedTo.length ? `${form.assignedTo.length} user dipilih` : "Ditugaskan Kepada"}
                </span>
                <span className="text-slate-400">v</span>
              </button>
              {isProjectAssigneeOpen && (
                <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                  {assignableUsers.map((user) => (
                    <label key={user.id} className={`mb-1 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm last:mb-0 ${form.assignedTo.includes(user.id) ? "bg-cyan-50" : "hover:bg-slate-50"}`}>
                      <span>
                        <span className="block font-bold text-slate-900">{user.name}</span>
                        <span className="text-xs text-slate-500">{roleLabel(user.role)}</span>
                      </span>
                      <input type="checkbox" checked={form.assignedTo.includes(user.id)} onChange={() => toggleProjectAssignee(user.id)} />
                    </label>
                  ))}
                </div>
              )}
              {form.assignedTo.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.assignedTo.map((id) => (
                    <span key={id} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{getUserName(users, id)}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleProjectSlice.map((project) => (
          <ProjectCard key={project.id} project={project} users={users} currentUser={currentUser} openProject={openProject} setProjects={setProjects} setArchivedProjectIds={setArchivedProjectIds} isArchived={archivedProjectIds.includes(project.id)} toggleArchiveProject={toggleArchiveProject} logActivity={logActivity} editingProjectId={editingProjectId} editProjectForm={editProjectForm} setEditProjectForm={setEditProjectForm} startEditProject={startEditProject} saveEditProject={saveEditProject} cancelEditProject={() => setEditingProjectId(null)} showToast={showToast} />
        ))}
      </div>
      <Pagination page={page} pageSize={pageSize} total={visibleProjects.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      {!visibleProjects.length && <EmptyState text="Belum ada project untuk role aktif ini." />}
    </section>
  );
}

function ProjectCard({ project, users, currentUser, openProject, setProjects, setArchivedProjectIds, isArchived, toggleArchiveProject, logActivity, editingProjectId, editProjectForm, setEditProjectForm, startEditProject, saveEditProject, cancelEditProject, showToast }) {
  const completion = project.tasks.reduce(
    (total, task) => {
      const counts = getTaskCompletionCounts(task);
      return { completed: total.completed + counts.completed, total: total.total + counts.total };
    },
    { completed: 0, total: 0 }
  );
  const progress = getProjectProgress(project);
  const deadlineState = getDeadlineState(project.deadlineAt, progress === 100);
  const overdueTasks = getProjectOverdueTasks(project).length;
  const isEditing = editingProjectId === project.id;
  return (
    <article className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${deadlineState.isOverdue || overdueTasks ? "is-overdue" : ""}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          {isEditing ? (
            <div className="grid gap-2">
              <input className="rounded-lg border border-slate-300 px-3 py-2" value={editProjectForm.title} onChange={(event) => setEditProjectForm({ ...editProjectForm, title: event.target.value })} />
              <input className="rounded-lg border border-slate-300 px-3 py-2" value={editProjectForm.description} onChange={(event) => setEditProjectForm({ ...editProjectForm, description: event.target.value })} />
              <input className="rounded-lg border border-slate-300 px-3 py-2" type="datetime-local" value={editProjectForm.deadlineAt} onChange={(event) => setEditProjectForm({ ...editProjectForm, deadlineAt: event.target.value })} />
            </div>
          ) : (
            <>
              <h3 className="text-lg font-black text-slate-950">{project.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description || "Tidak ada deskripsi."}</p>
            </>
          )}
        </div>
        <StatusPill state={deadlineState} />
      </div>
      <div className="mb-4 space-y-2 text-sm text-slate-600">
        <p><span className="font-bold">Dibuat Oleh:</span> {getUserName(users, project.createdBy)}</p>
        <p><span className="font-bold">Ditugaskan Kepada:</span> {getProjectAssigneeNames(users, project)}</p>
        <p><span className="font-bold">Dibuat:</span> {formatDate(project.createdAt)}</p>
        <DeadlineLine value={project.deadlineAt} state={deadlineState} />
        <p><span className="font-bold">Task selesai:</span> {completion.completed}/{completion.total}</p>
        {!!overdueTasks && <p className="overdue-note">{overdueTasks} task lewat deadline</p>}
      </div>
      <ProgressBar value={progress} tone={deadlineState.tone} />
      <div className="mt-5 flex gap-2">
        {isEditing ? (
          <>
            <button className="flex-1 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800" onClick={() => saveEditProject(project)}>Simpan</button>
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold" onClick={cancelEditProject}>Batal</button>
          </>
        ) : (
          <button className="flex-1 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800" onClick={() => openProject(project.id)}>
          <Icon name="external" />
          Detail
          </button>
        )}
        {!isEditing && <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold" onClick={() => startEditProject(project)}>Edit</button>}
        {getProjectStatus(project) === "completed" && (
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100" onClick={() => toggleArchiveProject(project)}>
            {isArchived ? "Buka" : "Arsip"}
          </button>
        )}
        <button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-40" disabled={!canDeleteProject(currentUser, project)} onClick={() => {
          if (!confirmAction(`Hapus project "${project.title}"?`)) return;
          setProjects((list) => list.filter((item) => item.id !== project.id));
          setArchivedProjectIds((list) => list.filter((id) => id !== project.id));
          logActivity("Project dihapus", project.title);
          showToast?.("Project dihapus", project.title, "danger");
        }}>
          <Icon name="trash" />
          Hapus
        </button>
      </div>
    </article>
  );
}

function ProjectDetailModal({ project, currentUser, users, setProjects, close, logActivity }) {
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assignedTo: [], deadlineAt: "", instructionAttachments: [] });
  const [isTaskAssigneeOpen, setIsTaskAssigneeOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState("running");
  const taskAssigneeRef = useRef(null);
  const assignableUsers = getTaskAssignableUsers(currentUser, users);
  const visibleTasks = project.tasks.filter((task) => canSeeTask(currentUser, task, project, users));
  const runningTasks = visibleTasks.filter((task) => !isTaskFullyCompleted(task));
  const completedTasks = visibleTasks.filter((task) => isTaskFullyCompleted(task));
  const filteredTasks = taskFilter === "completed" ? completedTasks : runningTasks;
  const projectProgress = getProjectProgress(project);
  const projectDeadlineState = getDeadlineState(project.deadlineAt, projectProgress === 100);
  const overdueTasks = getProjectOverdueTasks({ ...project, tasks: visibleTasks }).length;

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (taskAssigneeRef.current && !taskAssigneeRef.current.contains(event.target)) {
        setIsTaskAssigneeOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function updateProject(updater) {
    setProjects((list) => list.map((item) => (item.id === project.id ? updater(item) : item)));
  }

  function toggleTaskAssignee(userId) {
    setTaskForm((current) => ({
      ...current,
      assignedTo: current.assignedTo.includes(userId) ? current.assignedTo.filter((id) => id !== userId) : [...current.assignedTo, userId]
    }));
  }

  function addTask(event) {
    event.preventDefault();
    const allowedAssigneeIds = new Set(assignableUsers.map((user) => user.id));
    const assignedTo = taskForm.assignedTo.filter((id) => allowedAssigneeIds.has(id));
    if (!taskForm.title.trim()) return alert("Task title wajib diisi.");
    if (!assignedTo.length) return alert("Assigned user wajib diisi.");
    if (!taskForm.deadlineAt) return alert("Tanggal deadline wajib diisi.");
    updateProject((item) => ({
      ...item,
      tasks: [
        ...item.tasks,
        {
          id: makeId("t"),
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          instructionAttachments: taskForm.instructionAttachments,
        assignedTo,
        createdBy: currentUser.id,
        createdAt: nowIso(),
        deadlineAt: taskForm.deadlineAt,
          isCompleted: false,
          completedAt: null,
          completionProof: { note: "", links: [], files: [], submissions: [] }
        }
      ]
    }));
    setTaskForm({ title: "", description: "", assignedTo: [], deadlineAt: "", instructionAttachments: [] });
    setIsTaskAssigneeOpen(false);
    logActivity("Task dibuat", `${taskForm.title.trim()} - ${project.title} (assignee: ${assignedTo.map((id) => getUserName(users, id)).join(", ")}, deadline: ${formatDate(taskForm.deadlineAt)})`);
    close();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-5xl rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950">{project.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{project.description || "Tidak ada deskripsi."}</p>
            <p className="mt-2 text-sm text-slate-600">Ditugaskan Kepada: <strong>{getProjectAssigneeNames(users, project)}</strong></p>
            <DeadlineLine value={project.deadlineAt} state={projectDeadlineState} />
            {!!overdueTasks && <p className="overdue-note mt-2">{overdueTasks} task melewati deadline.</p>}
          </div>
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-100" onClick={close}>
            Batal
          </button>
        </div>
        <div className="space-y-6 p-5">
          <ProgressBar value={projectProgress} tone={projectDeadlineState.tone} />
          {canAddTask(currentUser, project) && (
            <form className="rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={addTask}>
              <h3 className="mb-3 font-black text-slate-950">Tambah Task</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Judul task" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} />
                <div className="relative" ref={taskAssigneeRef}>
                  <button type="button" className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm" onClick={() => setIsTaskAssigneeOpen((value) => !value)}>
                    <span className={taskForm.assignedTo.length ? "font-bold text-slate-800" : "text-slate-500"}>
                      {taskForm.assignedTo.length ? `${taskForm.assignedTo.length} user dipilih` : "Ditugaskan Kepada"}
                    </span>
                    <span className="text-slate-400">v</span>
                  </button>
                  {isTaskAssigneeOpen && (
                    <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                      {assignableUsers.map((user) => (
                        <label key={user.id} className={`mb-1 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm last:mb-0 ${taskForm.assignedTo.includes(user.id) ? "bg-cyan-50" : "hover:bg-slate-50"}`}>
                          <span>
                            <span className="block font-bold text-slate-900">{user.name}</span>
                            <span className="text-xs text-slate-500">{roleLabel(user.role)}</span>
                          </span>
                          <input type="checkbox" checked={taskForm.assignedTo.includes(user.id)} onChange={() => toggleTaskAssignee(user.id)} />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <label className="grid gap-1 text-xs font-bold uppercase text-slate-500 md:col-span-2">
                  Deadline Task
                  <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm normal-case text-slate-900" type="datetime-local" value={taskForm.deadlineAt} onChange={(event) => setTaskForm({ ...taskForm, deadlineAt: event.target.value })} />
                </label>
                <textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Instruksi task" value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} />
                {taskForm.assignedTo.length > 0 && (
                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    {taskForm.assignedTo.map((id) => (
                      <span key={id} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{getUserName(users, id)}</span>
                    ))}
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-600">Upload File Instruksi</label>
                  <input type="file" multiple onChange={(event) => setTaskForm({ ...taskForm, instructionAttachments: fileMetaList(event.target.files) })} />
                  <FileList files={taskForm.instructionAttachments} />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button className="rounded-lg bg-cyan-700 px-4 py-2 font-bold text-white hover:bg-cyan-800"><Icon name="check" />Simpan</button>
              </div>
            </form>
          )}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button className={`rounded-lg px-4 py-2 text-sm font-bold ${taskFilter === "running" ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-100"}`} onClick={() => setTaskFilter("running")}>
                Sedang Berjalan ({runningTasks.length})
              </button>
              <button className={`rounded-lg px-4 py-2 text-sm font-bold ${taskFilter === "completed" ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-100"}`} onClick={() => setTaskFilter("completed")}>
                Selesai ({completedTasks.length})
              </button>
            </div>
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} project={project} users={users} currentUser={currentUser} setProjects={setProjects} compact={false} onSubmitted={close} logActivity={logActivity} />
            ))}
            {!filteredTasks.length && <EmptyState text={taskFilter === "completed" ? "Belum ada task selesai." : "Belum ada task sedang berjalan."} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeadlinePage({ currentUser, users, projects, openProject, onSummaryOpen, searchQuery, archivedProjectIds = [] }) {
  const activeProjects = getVisibleProjects(currentUser, projects, users).filter((project) => !archivedProjectIds.includes(project.id));
  const overdueProjects = activeProjects.filter((project) => getProjectProgress(project) < 100 && isPastDeadline(project.deadlineAt));
  const overdueTasks = activeProjects.flatMap((project) => project.tasks.filter((task) => canSeeTask(currentUser, task, project, users)).map((task) => ({ ...task, projectId: project.id, projectTitle: project.title }))).filter((task) => !isTaskFullyCompleted(task) && isPastDeadline(task.deadlineAt));
  const total = overdueProjects.length + overdueTasks.length;
  const filteredOverdueProjects = overdueProjects.filter((project) => projectMatchesSearch(project, users, searchQuery));
  const filteredOverdueTasks = overdueTasks.filter((task) => {
    const project = projects.find((item) => item.id === task.projectId);
    return project ? taskMatchesSearch(task, project, users, searchQuery) : includesSearch(task.title, searchQuery);
  });

  return (
    <section className="space-y-4">
      <PageHeader title="Lewat Deadline" description="Daftar project dan task yang sudah melewati deadline dan belum selesai." />
      <SummaryMenu currentUser={currentUser} users={users} projects={projects} onSummaryOpen={onSummaryOpen} />
      <div className="deadline-alert">
        {searchQuery ? `Ditemukan ${filteredOverdueProjects.length + filteredOverdueTasks.length} dari ${total} project/task melewati deadline.` : `Total ${total} project/task melewati deadline.`}
      </div>
      <div className="dashboard-grid refined">
        <div className="work-panel">
          <div className="panel-heading">
            <div>
              <p>Overdue Project</p>
              <h2>Project Lewat Deadline</h2>
            </div>
            <span className="panel-total">{filteredOverdueProjects.length}</span>
          </div>
          <div className="project-list">
            {filteredOverdueProjects.map((project) => {
              const progress = getProjectProgress(project);
              const deadlineState = getDeadlineState(project.deadlineAt, progress === 100);
              return (
                <button key={project.id} className="project-row is-overdue" onClick={() => openProject(project.id)}>
                  <div className="project-row-main">
                    <div className="project-dot dot-danger" />
                    <div className="min-w-0">
                      <p className="project-title">{project.title}</p>
                      <p className="project-meta">Ditugaskan kepada {getProjectAssigneeNames(users, project)}</p>
                      <DeadlineLine value={project.deadlineAt} state={deadlineState} />
                    </div>
                    <span className="project-percent">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} tone="danger" />
                </button>
              );
            })}
            {!filteredOverdueProjects.length && <EmptyState text={searchQuery ? "Tidak ada project deadline yang cocok dengan pencarian." : "Tidak ada project lewat deadline."} />}
          </div>
        </div>
        <div className="work-panel">
          <div className="panel-heading">
            <div>
              <p>Overdue Task</p>
              <h2>Task Lewat Deadline</h2>
            </div>
            <span className="panel-total">{filteredOverdueTasks.length}</span>
          </div>
          <div className="deadline-list">
            {filteredOverdueTasks.map((task) => (
              <button key={`${task.projectId}_${task.id}`} className="deadline-item deadline-item-danger is-overdue" onClick={() => openProject(task.projectId)}>
                <div>
                  <p>{task.title}</p>
                  <span>{task.projectTitle}</span>
                  <DeadlineLine value={task.deadlineAt} state={getDeadlineState(task.deadlineAt, false)} />
                </div>
                <StatusPill state={getDeadlineState(task.deadlineAt, false)} />
              </button>
            ))}
            {!filteredOverdueTasks.length && <EmptyState text={searchQuery ? "Tidak ada task deadline yang cocok dengan pencarian." : "Tidak ada task lewat deadline."} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function TaskItem({ task, project, users, currentUser, setProjects, compact, onSubmitted, logActivity = () => {} }) {
  const [linkDraft, setLinkDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskForm, setEditTaskForm] = useState({ title: task.title, description: task.description || "", deadlineAt: task.deadlineAt || "" });
  const proof = task.completionProof || { note: "", links: [], files: [], submissions: [] };
  const assigneeIds = getTaskAssigneeIds(task);
  const activeCompletionUserId = assigneeIds.includes(currentUser.id) ? currentUser.id : assigneeIds[0];
  const currentCompletion = activeCompletionUserId ? getTaskCompletedBy(task, activeCompletionUserId) : { isCompleted: false, completedAt: null };
  const completionCounts = getTaskCompletionCounts(task);
  const deadlineState = getDeadlineState(task.deadlineAt, isTaskFullyCompleted(task));

  function updateTask(updater) {
    setProjects((list) =>
      list.map((item) =>
        item.id === project.id
          ? {
              ...item,
              tasks: item.tasks.map((projectTask) => (projectTask.id === task.id ? updater(projectTask) : projectTask))
            }
          : item
      )
    );
  }

  function toggleComplete() {
    if (!canCompleteTask(currentUser, task)) return;
    const nextCompletedForLog = !currentCompletion.isCompleted;
    updateTask((item) => {
      const assignees = getTaskAssigneeIds(item);
      const userId = assignees.includes(currentUser.id) ? currentUser.id : assignees[0];
      const nextCompleted = !isTaskCompletedBy(item, userId);
      const nextCompletedBy = {
        ...(item.completedBy || {}),
        [userId]: { isCompleted: nextCompleted, completedAt: nextCompleted ? nowIso() : null }
      };
      const nextItem = { ...item, completedBy: nextCompletedBy };
      return { ...nextItem, isCompleted: isTaskFullyCompleted(nextItem), completedAt: nextCompleted ? nextCompletedBy[userId].completedAt : item.completedAt };
    });
    logActivity(nextCompletedForLog ? "Status task diubah ke selesai" : "Status task dibuka kembali", `${task.title} - ${project.title} oleh ${getUserName(users, activeCompletionUserId)}`);
  }

  function updateProof(patch) {
    updateTask((item) => ({ ...item, completionProof: { ...item.completionProof, ...patch } }));
  }

  function saveEditTask() {
    if (!editTaskForm.title.trim()) return alert("Judul task wajib diisi.");
    const changes = [];
    if (task.title !== editTaskForm.title.trim()) changes.push(`judul: "${task.title}" -> "${editTaskForm.title.trim()}"`);
    if ((task.description || "") !== editTaskForm.description.trim()) changes.push("instruksi diperbarui");
    if ((task.deadlineAt || "") !== editTaskForm.deadlineAt) changes.push(`deadline: ${formatDate(task.deadlineAt)} -> ${formatDate(editTaskForm.deadlineAt)}`);
    updateTask((item) => ({ ...item, title: editTaskForm.title.trim(), description: editTaskForm.description.trim(), deadlineAt: editTaskForm.deadlineAt }));
    setIsEditingTask(false);
    logActivity("Task diperbarui", `${editTaskForm.title.trim()} - ${project.title}${changes.length ? ` (${changes.join(", ")})` : ""}`);
  }

  function addProofLink() {
    if (!linkDraft.trim()) return;
    updateProof({ links: [...(proof.links || []), linkDraft.trim()] });
    setLinkDraft("");
  }

  function submitProof() {
    if (!canSubmitProof(currentUser, task)) return;
    const submittedAt = nowIso();
    const userId = activeCompletionUserId;
    if (!userId) return;
    updateTask((item) => {
      const currentProof = item.completionProof || { note: "", links: [], files: [], submissions: [] };
      const submission = {
        id: makeId("proof"),
        submittedBy: currentUser.id,
        submittedAt,
        status: "submitted",
        reviewedBy: null,
        reviewedAt: null,
        reviewNote: "",
        note: currentProof.note || "",
        links: currentProof.links || [],
        files: currentProof.files || []
      };
      return {
        ...item,
        completionProof: {
          ...currentProof,
          submittedBy: currentUser.id,
          submittedAt,
          submissions: [submission, ...(currentProof.submissions || [])]
        }
      };
    });
    logActivity("Bukti task dikirim", `${task.title} - ${project.title} (menunggu review)`);
    onSubmitted?.();
  }

  function reviewSubmission(submissionId, status) {
    if (!canReviewProof(currentUser, project, task)) return;
    const reviewedAt = nowIso();
    updateTask((item) => {
      const currentProof = item.completionProof || { note: "", links: [], files: [], submissions: [] };
      const targetSubmission = (currentProof.submissions || []).find((submission) => submission.id === submissionId);
      const nextSubmissions = (currentProof.submissions || []).map((submission) =>
        submission.id === submissionId
          ? { ...submission, status, reviewedBy: currentUser.id, reviewedAt }
          : submission
      );
      let nextCompletedBy = item.completedBy || {};
      if (status === "approved" && targetSubmission?.submittedBy) {
        nextCompletedBy = {
          ...nextCompletedBy,
          [targetSubmission.submittedBy]: { isCompleted: true, completedAt: reviewedAt }
        };
      }
      if (status === "rejected" && targetSubmission?.submittedBy) {
        nextCompletedBy = {
          ...nextCompletedBy,
          [targetSubmission.submittedBy]: { isCompleted: false, completedAt: null }
        };
      }
      const nextItem = {
        ...item,
        completedBy: nextCompletedBy,
        completionProof: { ...currentProof, submissions: nextSubmissions }
      };
      return { ...nextItem, isCompleted: isTaskFullyCompleted(nextItem), completedAt: isTaskFullyCompleted(nextItem) ? reviewedAt : item.completedAt };
    });
    logActivity(`Bukti task ${proofStatusLabel(status).toLowerCase()}`, `${task.title} - ${project.title}`);
  }

  function addComment() {
    if (!commentDraft.trim()) return;
    const comment = { id: makeId("comment"), userId: currentUser.id, text: commentDraft.trim(), createdAt: nowIso() };
    updateTask((item) => ({ ...item, comments: [comment, ...(item.comments || [])] }));
    setCommentDraft("");
    logActivity("Komentar task ditambahkan", `${task.title} - ${project.title}`);
  }

  return (
    <article className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${deadlineState.isOverdue ? "is-overdue" : ""}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          {compact && <p className="mb-1 text-xs font-black uppercase text-cyan-700">{project.title}</p>}
          {isEditingTask ? (
            <div className="grid gap-2">
              <input className="rounded-lg border border-slate-300 px-3 py-2" value={editTaskForm.title} onChange={(event) => setEditTaskForm({ ...editTaskForm, title: event.target.value })} />
              <textarea className="rounded-lg border border-slate-300 px-3 py-2" value={editTaskForm.description} onChange={(event) => setEditTaskForm({ ...editTaskForm, description: event.target.value })} />
              <input className="rounded-lg border border-slate-300 px-3 py-2" type="datetime-local" value={editTaskForm.deadlineAt} onChange={(event) => setEditTaskForm({ ...editTaskForm, deadlineAt: event.target.value })} />
            </div>
          ) : (
            <>
              <h3 className="font-black text-slate-950">{task.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{task.description || "Tidak ada instruksi."}</p>
            </>
          )}
          <p className="mt-2 text-sm text-slate-500">Ditugaskan Kepada: <strong>{getTaskAssigneeNames(users, task)}</strong></p>
          <p className="mt-1 text-sm text-slate-500">Pembuat Task: <strong>{getUserName(users, task.createdBy || project.createdBy)}</strong></p>
          <DeadlineLine value={task.deadlineAt} state={deadlineState} />
          {deadlineState.isOverdue && <p className="overdue-note mt-1">Notif: task ini sudah melewati deadline.</p>}
          <p className="mt-1 text-sm text-slate-500">Progress Task: <strong>{completionCounts.completed}/{completionCounts.total} orang selesai</strong></p>
        </div>
        <div className="flex items-center gap-2">
          {canDeleteTask(currentUser, project, task) && (isEditingTask ? (
            <>
              <button className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-bold text-white" onClick={saveEditTask}>Simpan</button>
              <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold" onClick={() => setIsEditingTask(false)}>Batal</button>
            </>
          ) : (
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold" onClick={() => setIsEditingTask(true)}>Edit</button>
          ))}
          <button className={`task-status-button status-${currentCompletion.isCompleted ? "done" : deadlineState.tone}`} disabled={!canCompleteTask(currentUser, task)} onClick={toggleComplete}>
            <Icon name={currentCompletion.isCompleted ? "check" : "clock"} className="pill-icon" />
            {currentCompletion.isCompleted ? "Selesai" : "Belum Selesai"}
          </button>
          {canDeleteTask(currentUser, project, task) && (
            <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50" onClick={() => {
              if (!confirmAction(`Hapus task "${task.title}"?`)) return;
              setProjects((list) => list.map((item) => (item.id === project.id ? { ...item, tasks: item.tasks.filter((projectTask) => projectTask.id !== task.id) } : item)));
              logActivity("Task dihapus", `${task.title} - ${project.title}`);
            }}>
              <Icon name="trash" />
              Hapus
            </button>
          )}
        </div>
      </div>
      <FileList files={task.instructionAttachments} title="File Instruksi" />
      {currentCompletion.completedAt && <p className="mt-3 text-xs font-semibold text-slate-500">Completed At: {formatDate(currentCompletion.completedAt)}</p>}
      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="font-black text-slate-900">Bukti Penyelesaian</h4>
          {proof.submittedBy && <span className="text-xs font-bold text-slate-500">Terakhir dikirim oleh {getUserName(users, proof.submittedBy)} pada {formatDate(proof.submittedAt)}</span>}
        </div>
        <textarea className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" disabled={!canSubmitProof(currentUser, task)} placeholder="Catatan" value={proof.note || ""} onChange={(event) => updateProof({ note: event.target.value })} />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" disabled={!canSubmitProof(currentUser, task)} placeholder="Link Bukti (opsional)" value={linkDraft} onChange={(event) => setLinkDraft(event.target.value)} />
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-white disabled:opacity-40" disabled={!canSubmitProof(currentUser, task)} onClick={addProofLink}>
            <Icon name="plus" />
            Simpan
          </button>
        </div>
        <LinkList links={proof.links || []} />
        <div className="mt-3">
          <label className="mb-2 block text-sm font-bold text-slate-600">Upload File</label>
          <input type="file" multiple disabled={!canSubmitProof(currentUser, task)} onChange={(event) => updateProof({ files: [...(proof.files || []), ...fileMetaList(event.target.files)] })} />
          <FileList files={proof.files || []} />
        </div>
        <div className="mt-4 flex justify-end">
          <button className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-800 disabled:opacity-40" disabled={!canSubmitProof(currentUser, task)} onClick={submitProof}>
            <Icon name="check" />
            Kirim
          </button>
        </div>
        {!!proof.submissions?.length && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-black uppercase text-slate-500">Riwayat Pengiriman</p>
            {proof.submissions.map((submission) => (
              <div key={submission.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{getUserName(users, submission.submittedBy)}</p>
                    <p className="text-xs text-slate-500">{formatDate(submission.submittedAt)}</p>
                  </div>
                  <StatusPill state={{ label: proofStatusLabel(submission.status), tone: submission.status === "approved" ? "done" : submission.status === "rejected" ? "danger" : "active" }} />
                </div>
                {submission.note && <p className="mt-2 text-sm text-slate-600">{submission.note}</p>}
                <LinkList links={submission.links || []} />
                <FileList files={submission.files || []} />
                {submission.reviewedBy && <p className="mt-2 text-xs font-semibold text-slate-500">Direview oleh {getUserName(users, submission.reviewedBy)} pada {formatDate(submission.reviewedAt)}</p>}
                {canReviewProof(currentUser, project, task) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold" onClick={() => reviewSubmission(submission.id, "reviewed")}>Reviewed</button>
                    <button type="button" className="rounded-lg border border-green-200 px-3 py-2 text-xs font-bold text-green-700" onClick={() => reviewSubmission(submission.id, "approved")}>Approve</button>
                    <button type="button" className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700" onClick={() => reviewSubmission(submission.id, "rejected")}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <h4 className="font-black text-slate-900">Komentar Task</h4>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Tulis komentar..." value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} />
          <button type="button" className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold text-white" onClick={addComment}>Kirim</button>
        </div>
        <div className="mt-4 space-y-3">
          {(task.comments || []).map((comment) => (
            <div key={comment.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-bold text-slate-900">{getUserName(users, comment.userId)}</p>
              <p className="text-xs text-slate-500">{formatDate(comment.createdAt)}</p>
              <p className="mt-2 text-sm text-slate-600">{comment.text}</p>
            </div>
          ))}
          {!task.comments?.length && <p className="text-sm font-semibold text-slate-500">Belum ada komentar.</p>}
        </div>
      </div>
    </article>
  );
}

function TaskSummaryCard({ task, project, users, openDetail }) {
  const completionCounts = getTaskCompletionCounts(task);
  const deadlineState = getDeadlineState(task.deadlineAt, isTaskFullyCompleted(task));
  const progress = completionCounts.total ? Math.round((completionCounts.completed / completionCounts.total) * 100) : 0;

  return (
    <article className={`task-summary-card ${deadlineState.isOverdue ? "is-overdue" : ""}`}>
      <div className="task-summary-main">
        <div className={`project-dot dot-${deadlineState.tone}`} />
        <div className="min-w-0">
          <p className="page-kicker">{project.title}</p>
          <h3>{task.title}</h3>
          <p className="project-meta">Ditugaskan kepada {getTaskAssigneeNames(users, task)}</p>
          <p className={`deadline-mini ${deadlineState.isOverdue ? "is-danger" : ""}`}>Deadline: {formatDate(task.deadlineAt)}</p>
        </div>
      </div>
      <div className="task-summary-side">
        <StatusPill state={deadlineState} />
        <strong>{progress}%</strong>
        <small>{completionCounts.completed}/{completionCounts.total} orang selesai</small>
        <button className="detail-action" onClick={openDetail}>
          <Icon name="external" />
          Detail
        </button>
      </div>
    </article>
  );
}

function TaskDetailModal({ task, project, users, currentUser, setProjects, close, logActivity }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-5xl rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
          <div>
            <p className="page-kicker">{project.title}</p>
            <h2 className="text-2xl font-black text-slate-950">{task.title}</h2>
            <p className="mt-1 text-sm text-slate-500">Detail task, deadline, attachment, dan bukti penyelesaian.</p>
          </div>
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-100" onClick={close}>
            Tutup
          </button>
        </div>
        <div className="p-5">
          <TaskItem task={task} project={project} users={users} currentUser={currentUser} setProjects={setProjects} compact={false} onSubmitted={close} logActivity={logActivity} />
        </div>
      </div>
    </div>
  );
}

function MyTasksPage({ currentUser, users, projects, setProjects, openProject, onSummaryOpen, initialFilter = "running", initialDeadline = "all", initialAssignee = "all", searchQuery, logActivity, showToast }) {
  const [taskFilter, setTaskFilter] = useState(initialFilter);
  const [selectedTaskRef, setSelectedTaskRef] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TASK_PAGE_SIZE);
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline_asc");
  const visibleProjects = useMemo(() => getVisibleProjects(currentUser, projects, users), [currentUser, projects, users]);
  const allTasks = useMemo(
    () => currentUser.role === ROLES.SUPER_ADMIN
      ? visibleProjects.flatMap((project) => project.tasks.map((task) => ({ task, project })))
      : visibleProjects.flatMap((project) => project.tasks.filter((task) => getTaskAssigneeIds(task).includes(currentUser.id)).map((task) => ({ task, project }))),
    [currentUser, visibleProjects]
  );
  const tasks = useMemo(
    () => sortTaskItems(
      allTasks
        .filter(({ task, project }) => taskMatchesSearch(task, project, users, searchQuery))
        .filter(({ task }) => assigneeFilter === "all" || getTaskAssigneeIds(task).includes(assigneeFilter))
        .filter(({ task }) => deadlineFilter === "all" || (deadlineFilter === "month" && isThisMonth(task.deadlineAt)) || (deadlineFilter === "overdue" && !isTaskFullyCompleted(task) && isPastDeadline(task.deadlineAt))),
      sortBy
    ),
    [allTasks, users, searchQuery, assigneeFilter, deadlineFilter, sortBy]
  );
  const assignableUsers = getTaskAssignableUsers(currentUser, users);
  const runningTasks = tasks.filter(({ task }) => !isTaskFullyCompleted(task));
  const completedTasks = tasks.filter(({ task }) => isTaskFullyCompleted(task));
  const overdueTasks = tasks.filter(({ task }) => !isTaskFullyCompleted(task) && isPastDeadline(task.deadlineAt));
  const waitingProofTasks = tasks.filter(({ task }) => !isTaskFullyCompleted(task) && !(task.completionProof?.submissions || []).length);
  const assigneePendingTasks = tasks.filter(({ task }) =>
    assigneeFilter === "all"
      ? !isTaskFullyCompleted(task)
      : getTaskAssigneeIds(task).includes(assigneeFilter) && !isTaskCompletedBy(task, assigneeFilter)
  );
  const filteredTasks = taskFilter === "all" ? tasks : taskFilter === "completed" ? completedTasks : taskFilter === "overdue" ? overdueTasks : taskFilter === "waitingProof" ? waitingProofTasks : taskFilter === "assigneePending" ? assigneePendingTasks : runningTasks;
  const filteredTaskSlice = filteredTasks.slice((page - 1) * pageSize, page * pageSize);
  const selectedTaskItem = selectedTaskRef
    ? tasks.find(({ task, project }) => task.id === selectedTaskRef.taskId && project.id === selectedTaskRef.projectId)
    : null;
  const activeInsightNav = taskFilter === "waitingProof" ? "waitingProof" : null;

  useEffect(() => {
    setTaskFilter(initialFilter);
    setDeadlineFilter(initialDeadline);
    setAssigneeFilter(initialAssignee);
  }, [initialFilter, initialDeadline, initialAssignee]);

  useEffect(() => {
    setPage(1);
  }, [taskFilter, searchQuery, currentUser.id, assigneeFilter, deadlineFilter, sortBy, pageSize]);

  function exportTasks(format) {
    const headers = ["Task", "Project", "Status", "Progress", "Assignee", "Deadline"];
    const rows = filteredTasks.map(({ task, project }) => {
      const counts = getTaskCompletionCounts(task);
      return [
        task.title,
        project.title,
        isTaskFullyCompleted(task) ? "completed" : isPastDeadline(task.deadlineAt) ? "overdue" : "running",
        `${counts.completed}/${counts.total}`,
        getTaskAssigneeNames(users, task),
        formatDate(task.deadlineAt)
      ];
    });
    if (format === "csv") exportRowsToCsv("tasks.csv", headers, rows);
    else exportRowsToPdf("Export Task", headers, rows);
    showToast("Export task", `${rows.length} data diproses.`);
  }

  return (
    <section className="space-y-4">
      <PageHeader title="Tugas Saya" description="Lihat pekerjaan yang sedang berjalan dan task yang sudah selesai." />
      <SummaryMenu currentUser={currentUser} users={users} projects={projects} onSummaryOpen={onSummaryOpen} />
      <InsightQuickNav active={activeInsightNav} onSummaryOpen={onSummaryOpen} />
      <div className="filter-toolbar">
        <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
          <option value="all">Semua Assignee</option>
          {assignableUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
        <select value={deadlineFilter} onChange={(event) => setDeadlineFilter(event.target.value)}>
          <option value="all">Semua Deadline</option>
          <option value="month">Deadline Bulan Ini</option>
          <option value="overdue">Overdue</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="deadline_asc">Deadline Terdekat</option>
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="progress_desc">Progress Tertinggi</option>
          <option value="progress_asc">Progress Terendah</option>
        </select>
        <ExportActions onCsv={() => exportTasks("csv")} onPdf={() => exportTasks("pdf")} />
      </div>
      <div className="task-summary-list">
        {filteredTaskSlice.map(({ task, project }) => (
          <TaskSummaryCard
            key={`${project.id}_${task.id}`}
            task={task}
            project={project}
            users={users}
            openDetail={() => setSelectedTaskRef({ projectId: project.id, taskId: task.id })}
          />
        ))}
      </div>
      <Pagination page={page} pageSize={pageSize} total={filteredTasks.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      {!filteredTasks.length && <EmptyState text={taskFilter === "all" ? "Belum ada task." : taskFilter === "completed" ? "Belum ada task selesai." : taskFilter === "overdue" ? "Belum ada task lewat deadline." : taskFilter === "waitingProof" ? "Belum ada task yang menunggu bukti." : taskFilter === "assigneePending" ? "Tidak ada task yang belum dikerjakan oleh user ini." : "Belum ada task sedang berjalan."} />}
      {selectedTaskItem && (
        <TaskDetailModal
          task={selectedTaskItem.task}
          project={selectedTaskItem.project}
          users={users}
          currentUser={currentUser}
          setProjects={setProjects}
          logActivity={logActivity}
          close={() => setSelectedTaskRef(null)}
        />
      )}
    </section>
  );
}

function FileList({ files, title }) {
  if (!files?.length) return null;
  return (
    <div className="mt-3">
      {title && <p className="mb-2 text-xs font-black uppercase text-slate-500">{title}</p>}
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <div key={`${file.name}_${index}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <span className="file-title"><Icon name="file" /> <span className="font-bold text-slate-800">{file.name}</span></span>
            <span className="ml-2">{file.type}</span>
            <span className="ml-2">{Math.ceil((file.size || 0) / 1024)} KB</span>
            {file.previewUrl && file.type?.startsWith("image/") && <img className="mt-2 h-20 w-28 rounded object-cover" src={file.previewUrl} alt={file.name} />}
            {file.previewUrl ? (
              <div className="file-actions">
                <a className="font-bold text-cyan-700 hover:text-cyan-900" href={file.previewUrl} target="_blank" rel="noreferrer">
                  <Icon name="external" />
                  Lihat
                </a>
                <a className="font-bold text-cyan-700 hover:text-cyan-900" href={file.previewUrl} download={file.name}>
                  Download
                </a>
                <button type="button" className="font-bold text-cyan-700 hover:text-cyan-900" onClick={() => printFile(file.previewUrl)}>
                  Print
                </button>
              </div>
            ) : (
              <span className="mt-2 block text-slate-400">Preview tersedia selama sesi upload.</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkList({ links }) {
  if (!links.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((link, index) => (
        <a key={`${link}_${index}`} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 hover:bg-cyan-100" href={link} target="_blank" rel="noreferrer">
          {link}
        </a>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center font-bold text-slate-500">{text}</div>;
}




function formatFileSize(size = 0) {
  const n = Number(size) || 0;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

function downloadFileMeta(file) {
  const href = getFileHref(file);
  if (href) {
    const link = document.createElement("a");
    link.href = href;
    link.download = file.name || "lampiran";
    link.click();
    return;
  }
  downloadTextFile(`${file?.name || "lampiran"}.metadata.txt`, `File metadata localStorage\nNama: ${file?.name || "-"}\nTipe: ${file?.type || "-"}\nUkuran: ${formatFileSize(file?.size)}`);
}

function openFileMeta(file) {
  const href = getFileHref(file);
  if (href) return window.open(href, "_blank", "noopener,noreferrer");
  const popup = window.open("", "_blank");
  if (!popup) return alert("Popup diblokir browser. Izinkan popup untuk membuka metadata file.");
  popup.document.write(`<pre style="font:14px/1.6 system-ui;padding:24px;white-space:pre-wrap">Preview file asli hanya tersedia selama sesi upload browser belum direfresh.\n\nNama: ${escapeHtml(file?.name || "-")}\nTipe: ${escapeHtml(file?.type || "-")}\nUkuran: ${escapeHtml(formatFileSize(file?.size))}</pre>`);
  popup.document.close();
}

function printFileMeta(file) {
  const href = getFileHref(file);
  if (href) return printFile(href);
  const popup = window.open("", "_blank");
  if (!popup) return alert("Popup diblokir browser. Izinkan popup untuk print metadata file.");
  popup.document.write(`<h1>${escapeHtml(file?.name || "Lampiran")}</h1><p>Tipe: ${escapeHtml(file?.type || "-")}</p><p>Ukuran: ${escapeHtml(formatFileSize(file?.size))}</p>`);
  popup.document.close();
  popup.focus();
  popup.print();
}

function ItiFileList({ files = [], title = "Lampiran" }) {
  if (!files.length) return null;
  return <div className="iti-file-list">{title && <h4>{title}</h4>}{files.map((file, index) => {
    const href = getFileHref(file);
    const isImage = String(file.type || "").startsWith("image/") && href;
    return <div key={`${file.name}-${index}`} className="iti-file-row"><span>{isImage && <img className="iti-file-thumb" src={href} alt={file.name} />}<Icon name="file" /> <b>{file.name}</b><small>{file.type || "unknown"} • {formatFileSize(file.size)}{file.persisted ? " • tersimpan" : ""}</small></span><button type="button" onClick={() => openFileMeta(file)}>Open</button><button type="button" onClick={() => printFileMeta(file)}>Print</button><button type="button" onClick={() => downloadFileMeta(file)}>Download</button></div>;
  })}</div>;
}

function ItiAvatar({ name, size = "md" }) {
  const initial = String(name || "U").slice(0, 1).toUpperCase();
  return <span className={`iti-avatar iti-avatar-${size}`}>{initial}</span>;
}

function ItiLogoMark() {
  return (
    <div className="iti-logo-mark" aria-label="Institut Teknologi Indonesia">
      <span>ITI</span>
    </div>
  );
}

function ItiButton({ children, icon, className = "", onClick, type = "button" }) {
  return <button type={type} className={`iti-btn ${className}`} onClick={onClick}>{icon && <Icon name={icon} />}{children}</button>;
}

function makeSparklinePoints(values = []) {
  const clean = values.map((value) => Number(value) || 0);
  if (!clean.length) return "0,34 100,34";
  const max = Math.max(...clean, 1);
  return clean.map((value, index) => {
    const x = clean.length === 1 ? 50 : (index / (clean.length - 1)) * 100;
    const y = 38 - (value / max) * 28;
    return `${x.toFixed(1)},${Math.max(6, Math.min(38, y)).toFixed(1)}`;
  }).join(" ");
}

function ItiMiniStat({ title, value, note, icon = "project", tone = "blue", onClick, sparklineValues = null, progressValue = null, changeText = null, changeTone = "up" }) {
  const hasSparkline = Array.isArray(sparklineValues) && sparklineValues.length > 1;
  const hasProgress = typeof progressValue === "number";
  const visualClass = hasSparkline ? "has-sparkline" : hasProgress ? "has-progress" : "no-visual";
  return (
    <button type="button" className={`iti-stat-card insight-stat ${visualClass} ${onClick ? "is-clickable" : "is-static"}`} onClick={onClick}>
      <span className={`iti-stat-icon tone-${tone}`}><Icon name={icon} /></span>
      <span className="stat-main-copy">
        <small>{title}</small>
        <strong>{value}</strong>
        {note && <em>{note}</em>}
      </span>
      {hasSparkline ? (
        <span className={`mini-sparkline spark-${tone}`} aria-hidden="true">
          <svg viewBox="0 0 100 42" preserveAspectRatio="none"><polyline points={makeSparklinePoints(sparklineValues)} /></svg>
        </span>
      ) : hasProgress ? (
        <span className={`mini-progress-line tone-${tone}`} aria-hidden="true"><i><b style={{ width: `${Math.max(4, Math.min(100, progressValue))}%` }} /></i><span><small>0%</small><small>100%</small></span></span>
      ) : null}
    </button>
  );
}

function ItiProgressRing({ value = 0, label = "Progress" }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="iti-ring" style={{ "--value": `${safe}%` }}>
      <div>
        <strong>{safe}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function ItiHeaderKpiStrip({ stats = [] }) {
  if (!stats.length) return null;
  return (
    <div className="iti-header-kpi-strip" aria-label="Ringkasan halaman">
      {stats.map((item) => {
        const content = (
          <>
            <span className={`header-kpi-icon tone-${item.tone || "blue"}`}><Icon name={item.icon || "chart"} /></span>
            <span>
              <small>{item.title}</small>
              <strong>{item.value}</strong>
              {item.note ? <em>{item.note}</em> : null}
            </span>
          </>
        );
        return item.onClick ? (
          <button key={item.key || item.title} type="button" className="header-kpi-item is-clickable" onClick={item.onClick}>{content}</button>
        ) : (
          <div key={item.key || item.title} className="header-kpi-item">{content}</div>
        );
      })}
    </div>
  );
}

function ItiHeader({ currentUser, users, setCurrentUserId, searchQuery, setSearchQuery, backupData, restoreData, followUpTasks = [], appNotifications = [], markNotificationsRead, onNotificationClick, openProject, headerKpis = [] }) {
  const restoreInputRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = appNotifications.filter((n) => !n.read).length;
  function toggleNotif() {
    setNotifOpen((value) => !value);
    if (!notifOpen && unreadCount) markNotificationsRead?.();
  }
  return (
    <header className="iti-header">
      <div className="iti-titlebar">
        <h1><span>ITI</span> PROJECT MANAGER</h1>
        <p>Kelola proyek, tugas, dan kolaborasi institusi</p>
      </div>
      <div className="iti-top-tools">
        <label className="iti-search">
          <Icon name="search" />
          <input placeholder="Cari project, tugas, atau pengguna..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          <kbd>⌘ K</kbd>
        </label>
        <ItiButton icon="download" onClick={backupData}>Backup</ItiButton>
        <ItiButton icon="refresh" onClick={() => restoreInputRef.current?.click()}>Restore</ItiButton>
        <div className="iti-notif-wrap">
          <button type="button" className="iti-notif" aria-label="Notifikasi" onClick={toggleNotif}><Icon name="bell" />{!!unreadCount && <span>{Math.min(9, unreadCount)}</span>}</button>
          {notifOpen && <div className="iti-notif-panel"><div className="iti-notif-head"><strong>Notifikasi</strong><button type="button" className="mark-read" onClick={() => markNotificationsRead?.()}>Tandai Dibaca</button></div>{appNotifications.slice(0,10).map((n)=><button type="button" key={n.id} className={n.read ? "read" : "unread"} onClick={() => { setNotifOpen(false); onNotificationClick?.(n); }}><b>{n.title}</b><small>{n.message} • {formatDate(n.createdAt)}</small></button>)}{followUpTasks.length ? <><p className="notif-subtitle">Deadline terdekat</p>{followUpTasks.slice(0,6).map((task)=><button type="button" key={`${task.projectId}_${task.id}`} onClick={() => { setNotifOpen(false); openProject?.(task.projectId, task.id); }}><b>Deadline: {task.title}</b><small>{task.projectTitle || "Project"} • {formatDate(task.deadlineAt)}</small></button>)}</> : null}{!appNotifications.length && !followUpTasks.length && <p>Tidak ada notifikasi.</p>}</div>}
        </div>
        <label className="iti-user-select" title="Ganti user demo">
          <ItiAvatar name={currentUser.name} size="sm" />
          <select value={currentUser.id} onChange={(event) => setCurrentUserId(event.target.value)}>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name} — {roleLabel(user.role)}</option>)}
          </select>
        </label>
        <input ref={restoreInputRef} className="hidden" type="file" accept="application/json" onChange={(event) => { restoreData(event.target.files?.[0]); event.target.value = ""; }} />
      </div>
      <ItiHeaderKpiStrip stats={headerKpis} />
    </header>
  );
}


function ItiSidebar({ activePage, setActivePage, currentUser, onNavigate }) {
  const items = [
    ["dashboard", "Dashboard", "dashboard"],
    ...(currentUser.role !== ROLES.USER ? [["users", "Pengguna", "users"]] : []),
    ["projects", "Project", "project"],
    ...(currentUser.role !== ROLES.USER ? [["archives", "Arsip", "file"]] : []),
    ["tasks", "Tugas Saya", "tasks"],
    ["deadlines", "Deadline", "clock"],
    ["notifications", "Notifikasi", "bell"],
    ...(currentUser.role !== ROLES.USER ? [["activity", "Activity Log", "file"]] : []),
    ["profile", "Profil", "users"]
  ];
  const go = (page) => { setActivePage(page); onNavigate?.(); };
  return (
    <aside className="iti-sidebar">
      <div className="iti-campus-brand">
        <ItiLogoMark />
        <div>
          <strong>Institut<br />Teknologi<br />Indonesia</strong>
          <span>Technology-based<br />Entrepreneur University</span>
        </div>
      </div>
      <div className="iti-sidebar-sketch" />
      <div className="iti-profile-mini">
        <ItiAvatar name={currentUser.name} size="lg" />
        <div>
          <strong>{currentUser.name}</strong>
          <Badge role={currentUser.role} />
        </div>
      </div>
      <nav className="iti-nav">
        {items.map(([id, label, icon]) => (
          <button key={id} className={activePage === id ? "active" : ""} onClick={() => go(id)}>
            <Icon name={icon} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button className="iti-logout"><Icon name="external" />Logout</button>
      <div className="iti-sidebar-footer">
        <p><Icon name="clock" /> Serpong, Tangerang Selatan</p>
        <small>© 2026 Institut Teknologi Indonesia</small>
      </div>
    </aside>
  );
}

function ItiMobileBottomNav({ activePage, setActivePage, currentUser, unreadCount = 0, onNavigate }) {
  const items = [
    ["dashboard", "Home", "dashboard"],
    ["projects", "Project", "project"],
    ["tasks", "Task", "tasks"],
    ["deadlines", "Deadline", "clock"],
    ["notifications", "Notifikasi", "bell"],
    ...(currentUser.role !== ROLES.USER ? [["activity", "Activity Log", "file"]] : []),
    ["profile", "Profil", "users"]
  ].filter(([id]) => !(currentUser.role === ROLES.USER && ["users", "archives"].includes(id)));
  return <nav className="mobile-bottom-nav" aria-label="Navigasi mobile">{items.map(([id,label,icon]) => <button key={id} type="button" className={activePage === id ? "active" : ""} onClick={() => { onNavigate?.(); setActivePage(id); }}><span><Icon name={icon}/>{id === "notifications" && unreadCount ? <em>{Math.min(9, unreadCount)}</em> : null}</span><small>{label}</small></button>)}</nav>;
}

function ItiSectionTitle({ icon = "dashboard", title, subtitle, action }) {
  return (
    <div className="iti-section-title">
      <div className="iti-section-copy">
        <span><Icon name={icon} /></span>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function ItiProjectIcon({ index = 0 }) {
  const icons = ["project", "file", "lamp", "users", "chart", "tasks"];
  const tones = ["blue", "orange", "green", "purple", "teal", "navy"];
  return <span className={`iti-project-icon tone-${tones[index % tones.length]}`}><Icon name={icons[index % icons.length]} /></span>;
}

function buildDashboardActivityData(projects = [], tasks = [], monthsCount = 6) {
  const safeMonths = Math.max(1, Math.min(12, Number(monthsCount) || 6));
  const dateValues = [
    ...projects.flatMap((project) => [project.createdAt, project.deadlineAt]),
    ...tasks.flatMap(({ task }) => [
      task.createdAt,
      task.deadlineAt,
      task.completedAt,
      task.reviewedAt,
      getLatestSubmission(task)?.submittedAt,
      getLatestSubmission(task)?.reviewedAt
    ])
  ]
    .map((value) => new Date(value || 0))
    .filter((date) => !Number.isNaN(date.getTime()) && date.getFullYear() > 2000);
  const latest = dateValues.length ? new Date(Math.max(...dateValues.map((date) => date.getTime()))) : new Date(DEMO_REFERENCE_DATE || Date.now());
  latest.setDate(1);
  latest.setHours(23, 59, 59, 999);

  const months = Array.from({ length: safeMonths }, (_, index) => {
    const date = new Date(latest.getFullYear(), latest.getMonth() - (safeMonths - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: safeMonths === 12
        ? date.toLocaleDateString("id-ID", { month: "short" }).replace(".", "")
        : date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }).replace(".", ""),
      active: 0,
      review: 0,
      done: 0,
      projects: 0,
      tasks: 0
    };
  });
  const byKey = new Map(months.map((item) => [item.key, item]));
  const keyFromDate = (value) => {
    const date = new Date(value || latest);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };
  projects.forEach((project) => {
    const bucket = byKey.get(keyFromDate(project.createdAt || project.deadlineAt));
    if (bucket) bucket.projects += 1;
  });
  tasks.forEach(({ task }) => {
    const submissions = task.completionProof?.submissions || [];
    const latestSubmission = getLatestSubmission(task);
    const latestSubmitted = submissions.find((sub) => sub.status === "submitted");
    const latestApproved = submissions.find((sub) => ["approved", "verified"].includes(sub.status));
    let state = "active";
    let eventDate = task.createdAt || task.deadlineAt;
    if (isTaskFullyCompleted(task)) {
      state = "done";
      eventDate = task.completedAt || task.reviewedAt || latestApproved?.reviewedAt || latestApproved?.submittedAt || latestSubmission?.reviewedAt || latestSubmission?.submittedAt || eventDate;
    } else if (latestSubmitted) {
      state = "review";
      eventDate = latestSubmitted.submittedAt || latestSubmission?.submittedAt || eventDate;
    }
    const bucket = byKey.get(keyFromDate(eventDate));
    if (!bucket) return;
    bucket.tasks += 1;
    bucket[state] += 1;
  });
  return months;
}

function buildTeamProductivityData(projects = [], tasks = [], monthsCount = 6) {
  const safeMonths = Math.max(1, Math.min(12, Number(monthsCount) || 6));
  const dateValues = [
    ...tasks.flatMap(({ task }) => [
      task.createdAt,
      task.deadlineAt,
      task.completedAt,
      task.reviewedAt,
      getLatestSubmission(task)?.submittedAt,
      getLatestSubmission(task)?.reviewedAt
    ])
  ]
    .map((value) => new Date(value || 0))
    .filter((date) => !Number.isNaN(date.getTime()) && date.getFullYear() > 2000);
  const now = new Date();
  const latestFromTasks = dateValues.length ? new Date(Math.max(...dateValues.map((date) => date.getTime()))) : new Date(DEMO_REFERENCE_DATE || Date.now());
  const latest = latestFromTasks > now ? now : latestFromTasks;
  latest.setDate(1);
  latest.setHours(23, 59, 59, 999);

  return Array.from({ length: safeMonths }, (_, index) => {
    const monthStart = new Date(latest.getFullYear(), latest.getMonth() - (safeMonths - 1 - index), 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
    const key = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;
    const label = monthStart.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }).replace(".", "");
    const workedThisMonth = tasks.filter(({ task }) => {
      const startedAt = new Date(task.createdAt || task.deadlineAt || 0);
      const latestSubmission = getLatestSubmission(task);
      const finishedAt = new Date(task.completedAt || task.reviewedAt || latestSubmission?.reviewedAt || latestSubmission?.submittedAt || task.deadlineAt || monthEnd);
      const safeStart = Number.isNaN(startedAt.getTime()) ? monthStart : startedAt;
      const safeEnd = Number.isNaN(finishedAt.getTime()) ? monthEnd : finishedAt;
      return safeStart <= monthEnd && safeEnd >= monthStart;
    }).length;
    const visibleByMonth = tasks.filter(({ task }) => {
      const date = new Date(task.createdAt || 0);
      return Number.isNaN(date.getTime()) || date <= monthEnd;
    });
    const completedByMonth = visibleByMonth.filter(({ task }) => {
      if (!isTaskFullyCompleted(task)) return false;
      const date = new Date(task.completedAt || task.reviewedAt || getLatestSubmission(task)?.reviewedAt || getLatestSubmission(task)?.submittedAt || 0);
      return !Number.isNaN(date.getTime()) && date <= monthEnd;
    }).length;
    const avgProgress = visibleByMonth.length ? Math.round((completedByMonth / visibleByMonth.length) * 1000) / 10 : 0;
    return { key, label, completed: workedThisMonth, progress: avgProgress };
  });
}

function calcMonthChange(values = []) {
  const current = Number(values.at(-1) || 0);
  const previous = Number(values.at(-2) || 0);
  if (!previous && !current) return { text: "0%", tone: "up" };
  if (!previous) return { text: "+100%", tone: "up" };
  const diff = Math.round(((current - previous) / previous) * 100);
  return { text: `${diff > 0 ? "+" : ""}${diff}%`, tone: diff < 0 ? "down" : "up" };
}

function formatKpiNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function pctOf(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / total) * 1000) / 10;
}

function getDashboardLatestDate(projects = [], tasks = []) {
  const dates = [
    ...projects.flatMap((project) => [project.createdAt, project.deadlineAt]),
    ...tasks.flatMap(({ task }) => [
      task.createdAt,
      task.deadlineAt,
      task.completedAt,
      task.reviewedAt,
      getLatestSubmission(task)?.submittedAt,
      getLatestSubmission(task)?.reviewedAt
    ])
  ].map((value) => new Date(value || 0)).filter((date) => !Number.isNaN(date.getTime()) && date.getFullYear() > 2000);
  return dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : new Date();
}

function buildContributorSparkline(tasks = [], months = []) {
  return months.map((month) => {
    const ids = new Set();
    tasks.forEach(({ task }) => {
      const dates = [
        task.createdAt,
        task.completedAt,
        task.reviewedAt,
        getLatestSubmission(task)?.submittedAt,
        getLatestSubmission(task)?.reviewedAt
      ];
      const hasActivity = dates.some((value) => {
        const date = new Date(value || 0);
        const key = Number.isNaN(date.getTime()) ? null : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return key === month.key;
      });
      if (hasActivity) getTaskAssigneeIds(task).forEach((id) => ids.add(id));
    });
    return ids.size;
  });
}

function buildAverageCompletionDays(tasks = []) {
  const completedDurations = tasks
    .filter(({ task }) => isTaskFullyCompleted(task))
    .map(({ task }) => {
      const start = new Date(task.createdAt || 0);
      const end = new Date(task.completedAt || task.reviewedAt || getLatestSubmission(task)?.reviewedAt || getLatestSubmission(task)?.submittedAt || 0);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
      return Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    })
    .filter((value) => typeof value === "number");
  if (!completedDurations.length) return 0;
  return Math.round((completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length) * 10) / 10;
}

function ItiDashboardKpiCard({ number, title, subtitle, value, icon = "project", tone = "blue", sparklineValues = null, progressValue = null, metricText = null, changeText = "0%", changeTone = "up", changeSuffix = "", onClick }) {
  const hasSparkline = Array.isArray(sparklineValues) && sparklineValues.length > 1;
  const hasProgress = typeof progressValue === "number";
  return (
    <button type="button" className={`dashboard-kpi-card kpi-${tone}`} onClick={(event) => { event.preventDefault(); onClick?.(); }}>
      <span className="kpi-topline">
        <span className="kpi-icon"><Icon name={icon} /></span>
        <span className="kpi-title">
          <strong>{number}. {title}</strong>
          <small>{subtitle}</small>
        </span>
      </span>
      <span className="kpi-value">{value}</span>
      {hasSparkline ? (
        <span className="kpi-sparkline" aria-hidden="true">
          <svg viewBox="0 0 100 44" preserveAspectRatio="none">
            <polyline points={makeSparklinePoints(sparklineValues)} />
          </svg>
        </span>
      ) : null}
    </button>
  );
}

function ItiProgressLine({ projects = [], tasks = [] }) {
  const [range, setRange] = useState(6);
  const rows = useMemo(() => buildTeamProductivityData(projects, tasks, range), [projects, tasks, range]);
  const maxCompleted = Math.max(10, ...rows.map((item) => item.completed));
  const roundedMax = Math.max(10, Math.ceil(maxCompleted / 50) * 50);
  const chartHeight = 140;
  const barHeight = (value) => value ? Math.max(12, Math.round((value / roundedMax) * chartHeight)) : 4;
  const avgProgress = rows.length ? Math.round(rows.reduce((sum, item) => sum + item.progress, 0) / rows.length) : 0;
  const totalWorked = rows.reduce((sum, item) => sum + item.completed, 0);
  return (
    <div className="simple-productivity-card">
      <div className="iti-card-head chart-head-clean">
        <div>
          <strong>Produktivitas Tim</strong>
          <small>Task dikerjakan dan rata-rata progress sesuai akses role aktif.</small>
        </div>
        <select value={range} onChange={(event) => setRange(Number(event.target.value))}>
          <option value={1}>1 Bulan Terakhir</option>
          <option value={3}>3 Bulan Terakhir</option>
          <option value={6}>6 Bulan Terakhir</option>
          <option value={12}>12 Bulan Terakhir</option>
        </select>
      </div>
      <div className="simple-chart-summary">
        <span><b>{formatKpiNumber(totalWorked)}</b><small>task dikerjakan</small></span>
        <span><b>{avgProgress}%</b><small>rata-rata progress</small></span>
      </div>
      <div className="simple-bar-chart" style={{ "--month-count": rows.length }}>
        {rows.map((month) => (
          <div className="simple-bar-month" key={month.key}>
            <span className="simple-progress-value">{month.progress}%</span>
            <span className="simple-bar-value">{month.completed}</span>
            <i style={{ height: `${barHeight(month.completed)}px` }} />
            <small>{month.label}</small>
          </div>
        ))}
      </div>
      <div className="simple-chart-legend">
        <span><i />Task dikerjakan per bulan</span>
        <small>{formatKpiNumber(projects.length)} project / {formatKpiNumber(tasks.length)} task visible</small>
      </div>
    </div>
  );
}


function ItiDashboard({ currentUser, users, projects, openProject, onSummaryOpen, searchQuery, activityLogs, archivedProjectIds = [] }) {
  const visible = useMemo(() => getVisibleProjects(currentUser, projects, users).filter((p) => !archivedProjectIds.includes(p.id)).filter((p) => projectMatchesSearch(p, users, searchQuery)), [currentUser, projects, users, searchQuery, archivedProjectIds]);
  const visibleProjectIds = useMemo(() => new Set(visible.map((project) => project.id)), [visible]);
  const tasks = visible.flatMap((project) => project.tasks.filter((task) => canSeeTask(currentUser, task, project, users)).map((task) => ({ task, project })));
  const completed = tasks.filter(({ task }) => isTaskFullyCompleted(task)).length;
  const review = tasks.filter(({ task }) => (task.completionProof?.submissions || []).some((s) => s.status === "submitted") && !isTaskFullyCompleted(task)).length;
  const running = tasks.filter(({ task }) => !isTaskFullyCompleted(task) && !(task.completionProof?.submissions || []).length && !isPastDeadline(task.deadlineAt)).length;
  const overdue = tasks.filter(({ task }) => !isTaskFullyCompleted(task) && isPastDeadline(task.deadlineAt)).length;
  const avgProgress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const featured = visible.slice(0, 6);
  const activityData = buildDashboardActivityData(visible, tasks, 6);
  const projectSpark = activityData.map((item) => item.projects);
  const taskSpark = activityData.map((item) => item.tasks);
  const runningSpark = activityData.map((item) => item.active);
  const reviewSpark = activityData.map((item) => item.review);
  const doneSpark = activityData.map((item) => item.done);
  const activeProjects = visible.filter((project) => getProjectProgress(project) < 100).length;
  const completedProjects = visible.filter((project) => getProjectProgress(project) >= 100 || getProjectStatus(project) === "completed").length;
  const latestDate = getDashboardLatestDate(visible, tasks);
  const last30Start = addDays(latestDate, -30);
  const activeContributorIds = new Set();
  tasks.forEach(({ task }) => {
    const dates = [task.createdAt, task.completedAt, task.reviewedAt, getLatestSubmission(task)?.submittedAt, getLatestSubmission(task)?.reviewedAt]
      .map((value) => new Date(value || 0))
      .filter((date) => !Number.isNaN(date.getTime()));
    if (dates.some((date) => date >= last30Start && date <= latestDate)) getTaskAssigneeIds(task).forEach((id) => activeContributorIds.add(id));
  });
  const contributorSpark = buildContributorSparkline(tasks, activityData);
  const avgCompletionDays = buildAverageCompletionDays(tasks);
  const projectChange = calcMonthChange(projectSpark);
  const taskChange = calcMonthChange(taskSpark);
  const runningChange = calcMonthChange(runningSpark);
  const reviewChange = calcMonthChange(reviewSpark);
  const doneChange = calcMonthChange(doneSpark);
  const activeProjectChange = calcMonthChange(activityData.map((item) => item.projects ? Math.round(activeProjects / Math.max(1, visible.length) * item.projects) : 0));
  const completedProjectChange = calcMonthChange(activityData.map((item) => item.projects ? Math.round(completedProjects / Math.max(1, visible.length) * item.projects) : 0));
  const contributorChange = calcMonthChange(contributorSpark);
  const runningProgress = tasks.length ? Math.round((running / tasks.length) * 100) : 0;
  const reviewProgress = tasks.length ? Math.round((review / tasks.length) * 100) : 0;
  const overdueProgress = tasks.length ? Math.round((overdue / tasks.length) * 100) : 0;
  const completedProgress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const activeProjectProgress = visible.length ? Math.round((activeProjects / visible.length) * 100) : 0;
  const completedProjectProgress = visible.length ? Math.round((completedProjects / visible.length) * 100) : 0;
  const deadlines = tasks.filter(({ task }) => !isTaskFullyCompleted(task)).sort((a, b) => new Date(a.task.deadlineAt) - new Date(b.task.deadlineAt)).slice(0, 3);
  const latestActivities = (Array.isArray(activityLogs) ? activityLogs : []).filter((log) => canSeeActivityLog(currentUser, users, log, visibleProjectIds)).slice(0, 4);

  return (
    <div className="iti-page">
      <div className="dashboard-top-overview">
        <section className="iti-hero-card compact-hero-card">
          <div className="iti-campus-line" />
          <h2>Selamat pagi, {currentUser.name}! 👋</h2>
          <p>Ringkasan ini menampilkan performa project di Institut Teknologi Indonesia dengan progress yang dihitung dari task yang sudah verified checked.</p>
          <div className="iti-hero-note compact-hero-note">
            <Icon name="lamp" />
            <div>
              <strong>Progress institusi: {avgProgress}%</strong>
              <span>{completed} dari {tasks.length} task sudah verified. {running} task berjalan belum submit.</span>
            </div>
          </div>
        </section>
        <div className="iti-progress-card compact-progress-card">
          <strong>Progress Institusi</strong>
          <ItiProgressRing value={avgProgress} label="Verified" />
          <small>{completed}/{tasks.length} task verified checked</small>
        </div>
      </div>

      <section className="dashboard-kpi-section">
        <div className="dashboard-kpi-head">
          <strong>10 KPI Cards - Project Manager Dashboard</strong>
          <small>Data real-time berdasarkan project & task yang dapat dilihat oleh role aktif</small>
        </div>
        <div className="dashboard-kpi-grid">
          <ItiDashboardKpiCard number="1" title="Total Project" subtitle="Semua Project" value={formatKpiNumber(visible.length)} icon="project" tone="blue" sparklineValues={projectSpark} changeText={projectChange.text} changeTone={projectChange.tone} onClick={() => onSummaryOpen("projects", "all")} />
          <ItiDashboardKpiCard number="2" title="Total Task" subtitle="Semua Task" value={formatKpiNumber(tasks.length)} icon="file" tone="orange" sparklineValues={taskSpark} changeText={taskChange.text} changeTone={taskChange.tone} onClick={() => onSummaryOpen("tasks", "all")} />
          <ItiDashboardKpiCard number="3" title="Task Berjalan" subtitle="Sedang Dikerjakan" value={formatKpiNumber(running)} icon="clock" tone="blue" sparklineValues={runningSpark} changeText={runningChange.text} changeTone={runningChange.tone} onClick={() => onSummaryOpen("tasks", "active")} />
          <ItiDashboardKpiCard number="4" title="Dalam Review" subtitle="Menunggu Validasi" value={formatKpiNumber(review)} icon="clock" tone="yellow" sparklineValues={reviewSpark} changeText={reviewChange.text} changeTone={reviewChange.tone} onClick={() => onSummaryOpen("tasks", "review")} />
          <ItiDashboardKpiCard number="5" title="Lewat Deadline" subtitle="Perlu Tindakan Cepat" value={formatKpiNumber(overdue)} icon="alert" tone="red" sparklineValues={activityData.map((item) => Math.round((overdue / Math.max(1, tasks.length)) * item.tasks))} changeText="" changeTone="down" onClick={() => onSummaryOpen("tasks", "overdue")} />
          <ItiDashboardKpiCard number="6" title="Task Selesai" subtitle="Selesai & Terverifikasi" value={formatKpiNumber(completed)} icon="check" tone="green" sparklineValues={doneSpark} changeText={doneChange.text} changeTone={doneChange.tone} onClick={() => onSummaryOpen("tasks", "completed")} />
          <ItiDashboardKpiCard number="7" title="Project Aktif" subtitle="Sedang Berjalan" value={formatKpiNumber(activeProjects)} icon="project" tone="purple" sparklineValues={activityData.map((item) => item.projects ? Math.round(activeProjects / Math.max(1, visible.length) * item.projects) : 0)} changeText={activeProjectChange.text} changeTone={activeProjectChange.tone} onClick={() => onSummaryOpen("projects", "active")} />
          <ItiDashboardKpiCard number="8" title="Project Selesai" subtitle="Selesai & Terverifikasi" value={formatKpiNumber(completedProjects)} icon="check" tone="teal" sparklineValues={activityData.map((item) => item.projects ? Math.round(completedProjects / Math.max(1, visible.length) * item.projects) : 0)} changeText={completedProjectChange.text} changeTone={completedProjectChange.tone} onClick={() => onSummaryOpen("projects", "completed")} />
          <ItiDashboardKpiCard number="9" title="Kontributor Aktif" subtitle="User Aktif Berkontribusi" value={formatKpiNumber(activeContributorIds.size)} icon="users" tone="pink" sparklineValues={contributorSpark} changeText={contributorChange.text} changeTone={contributorChange.tone} onClick={() => currentUser.role !== ROLES.USER ? onSummaryOpen("users") : onSummaryOpen("tasks", "all")} />
          <ItiDashboardKpiCard number="10" title="Rata-rata Waktu" subtitle="Selesaikan Task" value={avgCompletionDays} icon="clock" tone="purple" sparklineValues={doneSpark.map((value) => value ? avgCompletionDays : 0)} changeText="" changeTone="down" onClick={() => onSummaryOpen("tasks", "completed")} />
        </div>
        <p className="dashboard-kpi-note">Semua data dihitung dari project & task yang dapat dilihat oleh role aktif.</p>
      </section>

      <div className="iti-dashboard-mid refined-dashboard-mid dashboard-productivity-grid">
        <section className="iti-chart-card equal-height-card productivity-wide-card">
          <ItiProgressLine projects={visible} tasks={tasks} />
        </section>
        <section className="iti-list-card equal-height-card">
          <div className="iti-card-head"><strong>Deadline & Tindak Lanjut</strong><button onClick={() => onSummaryOpen("deadlines")}>Lihat Semua</button></div>
          <div className="iti-feed-list">
            {deadlines.map(({ task, project }, i) => (
              <button key={task.id} className={`iti-deadline-item tone-${i === 0 ? "red" : "orange"}`} onClick={() => openProject(project.id, task.id)}>
                <Icon name={i === 0 ? "alert" : "clock"} />
                <span className="iti-feed-copy">
                  <strong>{project.title}</strong>
                  <small>{task.title}</small>
                  <small>{formatDate(task.deadlineAt)}</small>
                </span>
                <em>{isPastDeadline(task.deadlineAt) ? "Lewat Deadline" : "Prioritas"}</em>
              </button>
            ))}
            {!deadlines.length && <div className="iti-empty-inline"><Icon name="clock" /><span>Tidak ada deadline aktif.</span></div>}
          </div>
        </section>
        <section className="iti-list-card equal-height-card">
          <div className="iti-card-head"><strong>Aktivitas Terbaru</strong></div>
          <div className="iti-feed-list">
            {latestActivities.map((log) => (
              <button key={log.id} className="iti-activity-feed-item" onClick={() => log.projectId ? openProject(log.projectId, log.taskId || null) : onSummaryOpen("activity")}>
                <span className="iti-activity-feed-icon"><Icon name={log.taskId ? "tasks" : log.projectId ? "project" : "check"} /></span>
                <span className="iti-feed-copy">
                  <strong>{log.action}</strong>
                  <small>{log.detail}</small>
                  <small>{getUserName(users, log.userId)} • {formatDate(log.createdAt)}</small>
                </span>
              </button>
            ))}
            {!latestActivities.length && <div className="iti-empty-inline"><Icon name="file" /><span>Belum ada aktivitas.</span></div>}
          </div>
        </section>
      </div>

      <section className="iti-project-summary refined-project-summary">
        <div className="iti-card-head"><strong>Ringkasan Project Aktif</strong><button onClick={() => onSummaryOpen("projects", "active")}>Lihat Semua Project</button></div>
        <div className="iti-summary-grid refined-summary-grid">
          {featured.map((project, i) => {
            const progress = getProjectProgress(project);
            return (
              <button type="button" className="iti-summary-project" key={project.id} onClick={() => openProject(project.id)}>
                <ItiProjectIcon index={i} />
                <span className="iti-summary-copy">
                  <b>{project.title}</b>
                  <small>Owner: {getUserName(users, getProjectOwnerId(project))}</small>
                  <small>Deadline: {formatDate(project.deadlineAt)}</small>
                  <i className="mini-line"><b style={{ width: `${progress}%` }} /></i>
                  <small className="progress-note">{progress}% verified checked</small>
                </span>
                <em>{getProjectStatus(project) === "completed" ? "Selesai" : getProjectStatus(project) === "overdue" ? "Terlambat" : "Aktif"}</em>
              </button>
            );
          })}
        </div>
        {!featured.length && <EmptyProfessionalState icon="project" title="Belum ada project aktif" description="Project aktif akan muncul di sini setelah dibuat atau ditugaskan." />}
      </section>
    </div>
  );
}

function ItiModal({ title, children, onClose }) {
  return (
    <div className="iti-modal-backdrop" onMouseDown={onClose}>
      <section className="iti-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="iti-modal-head"><h3>{title}</h3><button type="button" onClick={onClose}>×</button></div>
        {children}
      </section>
    </div>
  );
}

function ItiField({ label, children }) {
  return <label className="iti-field"><span>{label}</span>{children}</label>;
}

const userEmail = (user) => user.email || `${String(user.name || "user").toLowerCase().replaceAll(" ", ".")}@iti.ac.id`;
const userUnit = (user, index = 0) => {
  const mappedUnits = {
    u_super: "Team PDSI",
    u_admin_a: "Rektor",
    u_admin_b: "Warek A",
    u_moderator_a: "Kepala PMB",
    u_user_a: "Staf PMB",
    u_user_b: "Staf PKA",
    u_user_c: "Staf Program Studi"
  };
  if (user.unit) return user.unit;
  if (mappedUnits[user.id]) return mappedUnits[user.id];
  if (user.role === ROLES.SUPER_ADMIN) return "Team PDSI";
  if (user.role === ROLES.ADMIN) return ["Rektor", "Warek A", "Warek B"][index % 3];
  if (user.role === ROLES.MODERATOR) return ["Kepala PMB", "Kepala PKA", "Kepala Program Studi", "Kepala Fasilitas", "Kepala Pusat Akademik"][index % 5];
  return ["Staf PMB", "Staf PKA", "Staf Program Studi", "Staf Fasilitas", "Staf Pusat Akademik"][index % 5];
};
const projectUnit = (project, index = 0) => project.unit || ["Akreditasi", "PMB", "Laboratorium", "Riset", "Kemahasiswaan", "Website", "Kerja Sama"][index % 7];

function ItiUsersPage({ currentUser, users, projects, setUsers, setProjects, searchQuery, showToast, logActivity }) {
  const [modal, setModal] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [localSearch, setLocalSearch] = useState("");
  const visibleUsers = getVisibleUsers(currentUser, users);
  const units = Array.from(new Set(visibleUsers.map((user, index) => userUnit(user, index))));
  const creatableRoles = Object.values(ROLES).filter((role) => canCreateRole(currentUser, role));
  const filtered = visibleUsers
    .filter((user, index) => userMatchesSearch(user, users, searchQuery || localSearch))
    .filter((user) => roleFilter === "all" || user.role === roleFilter)
    .filter((user) => statusFilter === "all" || (statusFilter === "active" ? user.status !== "inactive" : user.status === "inactive"))
    .filter((user, index) => unitFilter === "all" || userUnit(user, index) === unitFilter);
  const roleCounts = (role) => users.filter((user) => user.role === role).length;

  function saveUser(event) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const id = fd.get("id");
    const targetUser = id ? users.find((user) => user.id === id) : null;
    const requestedRole = fd.get("role");
    const role = id ? (canChangeRole(currentUser) ? requestedRole : targetUser?.role || ROLES.USER) : requestedRole;
    const payload = {
      name: fd.get("name")?.trim() || "Pengguna Baru",
      email: fd.get("email")?.trim() || "",
      phone: fd.get("phone")?.trim() || "",
      unit: fd.get("unit")?.trim() || "Akademik",
      role,
      status: fd.get("status") || "active"
    };
    if (!id && !canCreateRole(currentUser, role)) return showToast("Akses ditolak", `${roleLabel(currentUser.role)} tidak dapat membuat ${roleLabel(role)}.`, "danger");
    if (id && targetUser && targetUser.role === ROLES.SUPER_ADMIN && role !== ROLES.SUPER_ADMIN && users.filter((user)=>user.role === ROLES.SUPER_ADMIN).length <= 1) {
      return showToast("Role belum bisa diturunkan", "Minimal harus ada satu SUPERADMIN aktif di sistem.", "danger");
    }
    if (id && targetUser && role !== targetUser.role) {
      const ownsProject = projects.some((project) => getProjectOwnerId(project) === targetUser.id);
      const ownsActiveTask = projects.some((project) => project.tasks.some((task) => task.createdBy === targetUser.id && !isTaskFullyCompleted(task)));
      const hasChildren = users.filter((user)=>user.createdBy === targetUser.id);
      const hasModeratorChildren = hasChildren.some((user)=>user.role === ROLES.MODERATOR);
      if (role === ROLES.USER && (ownsProject || ownsActiveTask || hasChildren.length)) {
        return showToast("Role belum bisa diturunkan", "Pindahkan ownership project, reviewer task, dan bawahan aktif terlebih dahulu.", "danger");
      }
      if (role === ROLES.MODERATOR && (ownsProject || ownsActiveTask || hasModeratorChildren)) {
        return showToast("Role belum bisa diturunkan", "Admin yang punya project/task aktif atau Moderator bawahan harus dipindahkan dulu.", "danger");
      }
    }
    setUsers((list) => id ? list.map((user) => user.id === id ? { ...user, ...payload } : user) : [...list, { id: makeId("u"), createdBy: currentUser.id, ...payload }]);
    logActivity(id ? "Pengguna diperbarui" : "Pengguna ditambahkan", payload.name);
    showToast(id ? "Pengguna diperbarui" : "Pengguna ditambahkan", payload.name);
    setModal(null);
  }

  function deleteUser(user) {
    if (!canDeleteUser(currentUser, user, users)) return showToast("Akses ditolak", "Role Anda tidak diizinkan menghapus pengguna ini.", "danger");
    const hasOwnedProject = projects.some((project) => getProjectOwnerId(project) === user.id);
    const hasTaskResponsibility = projects.some((project) => project.tasks.some((task) => task.createdBy === user.id || getTaskAssigneeIds(task).includes(user.id)));
    if (hasOwnedProject || hasTaskResponsibility) {
      return showToast("Tidak bisa menghapus", "Pindahkan ownership project, reviewer, dan task user ini terlebih dahulu.", "danger");
    }
    if (!confirmAction(`Hapus pengguna ${user.name}?`)) return;
    setUsers((list) => list.filter((item) => item.id !== user.id));
    setProjects((projectList) => projectList.map((project) => ({
      ...project,
      assignedTo: (project.assignedTo || []).filter((id) => id !== user.id),
      tasks: project.tasks.map((task) => ({
        ...task,
        assignedTo: (task.assignedTo || []).filter((id) => id !== user.id),
        completedBy: Object.fromEntries(Object.entries(task.completedBy || {}).filter(([id]) => id !== user.id))
      }))
    })));
    logActivity("Pengguna dihapus", user.name);
    showToast("Pengguna dihapus", user.name);
  }

  return (
    <div className="iti-page">
      <ItiSectionTitle icon="users" title="Manajemen Pengguna" subtitle="Kelola pengguna, peran (role), dan akses sistem di lingkungan Institut Teknologi Indonesia." action={canCreateUser(currentUser) && <ItiButton className="primary" icon="plus" onClick={() => setModal({ type: "user" })}>Tambah Pengguna</ItiButton>} />
      <div className="iti-stat-row five"><ItiMiniStat title="Total Pengguna" value={users.length} note="Akun terdaftar" icon="users" tone="blue" /><ItiMiniStat title="Admin" value={roleCounts(ROLES.ADMIN)} note="Akses admin" icon="check" tone="orange" /><ItiMiniStat title="Moderator" value={roleCounts(ROLES.MODERATOR)} note="Koordinator unit" icon="users" tone="green" /><ItiMiniStat title="User" value={roleCounts(ROLES.USER)} note="Pengguna biasa" icon="users" tone="yellow" /><ItiMiniStat title="Akun Aktif" value={users.filter((u)=>u.status !== "inactive").length} note="Aktif" icon="check" tone="green" /></div>
      <div className="iti-filter-bar"><ItiField label="Cari Nama / Email"><input placeholder="Cari nama atau email..." value={localSearch} onChange={(e)=>setLocalSearch(e.target.value)} /></ItiField><ItiField label="Role"><select value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)}><option value="all">Semua Role</option>{Object.values(ROLES).map((role)=><option key={role} value={role}>{roleLabel(role)}</option>)}</select></ItiField><ItiField label="Status"><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}><option value="all">Semua Status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></ItiField><ItiField label="Unit Kerja"><select value={unitFilter} onChange={(e)=>setUnitFilter(e.target.value)}><option value="all">Semua Unit</option>{units.map((unit)=><option key={unit} value={unit}>{unit}</option>)}</select></ItiField><ItiButton icon="refresh" onClick={()=>{setLocalSearch(""); setRoleFilter("all"); setStatusFilter("all"); setUnitFilter("all");}}>Reset</ItiButton></div>
      <div className="iti-split-layout">
        <section className="iti-table-card grow"><div className="iti-table iti-users-table"><div className="thead"><span>Pengguna</span><span>Email</span><span>Role</span><span>Status</span><span>Unit Kerja</span><span>Project / Tugas</span><span>Aksi</span></div>{filtered.map((user, index) => <div className="tr" key={user.id}><span className="person"><ItiAvatar name={user.name} /><b>{user.name}</b><small>{roleLabel(user.role)}</small></span><span>{userEmail(user)}</span><span><Badge role={user.role} /></span><span><em className={user.status === "inactive" ? "status off" : "status"}>{user.status === "inactive" ? "Nonaktif" : "Aktif"}</em></span><span>{userUnit(user, index)}</span><span><b>{24 - (index % 9)} / {312 - (index % 9) * 22}</b><i className="mini-line"><b style={{ width: `${Math.max(8, 80 - (index % 9) * 7)}%` }} /></i></span><span className="iti-actions"><button title="Detail" onClick={() => setModal({ type: "detailUser", user })}><Icon name="external" /></button><button title="Edit" onClick={() => setModal({ type: "user", user })}><Icon name="file" /></button><button title="Reset password" onClick={() => showToast("Password direset", `Password demo untuk ${user.name}: iti12345`)}><Icon name="refresh" /></button><button title="Hapus" onClick={() => deleteUser(user)}><Icon name="trash" /></button></span></div>)}</div><div className="iti-pagination">Menampilkan {filtered.length ? `1–${filtered.length}` : "0"} dari {users.length} pengguna <span><button>‹</button><button className="active">1</button><button>›</button></span></div></section>
        <aside className="iti-side-stack"><section className="iti-card"><h3>Ringkasan Hak Akses</h3><div className="permission-mini"><span>Fitur</span><span>SA</span><span>Admin</span><span>Mod</span><span>User</span>{["Kelola Project","Kelola Pengguna","Kelola Deadline","Arsip & Dokumen","Laporan"].flatMap((r,i)=>[<b key={r}>{r}</b>,...Array.from({length:4},(_,j)=><em key={r+j} className={j<=2 || i===0 ? "yes":"no"}>{j<=2 || i===0 ? "✓":"×"}</em>)])}</div></section><section className="iti-card"><h3>Insight Pengguna</h3><p>Pengguna baru <b>{users.filter((u)=>u.createdBy===currentUser.id).length}</b></p><p>Pengguna aktif <b>{users.filter((u)=>u.status !== "inactive").length}</b></p><p>Rasio aktivitas <b>{users.length ? Math.round(users.filter((u)=>u.status !== "inactive").length/users.length*100) : 0}%</b></p></section></aside>
      </div>

      {modal?.type === "detailUser" && (() => {
        const summary = getUserWorkSummary(modal.user, projects);
        return <ItiModal title={`Detail User - ${modal.user.name}`} onClose={()=>setModal(null)}>
          <div className="user-detail-modal">
            <div className="user-detail-hero"><ItiAvatar name={modal.user.name} size="xl" /><div><h3>{modal.user.name}</h3><Badge role={modal.user.role}/><p>{userEmail(modal.user)}</p><small>{modal.user.unit || "Unit belum diisi"}</small></div></div>
            <div className="iti-stat-row four compact"><ItiMiniStat title="Project Diikuti" value={summary.memberProjects.length} icon="project" tone="blue" /><ItiMiniStat title="Task Aktif" value={summary.assignedTasks.filter(({task})=>!isTaskFullyCompleted(task)).length} icon="tasks" tone="orange" /><ItiMiniStat title="Menunggu Review" value={summary.reviewTasks.length} icon="clock" tone="yellow" /><ItiMiniStat title="Progress" value={`${summary.progress}%`} icon="chart" tone="green" /></div>
            <section className="iti-card"><h3>Project yang Diikuti</h3>{summary.memberProjects.slice(0,6).map((project)=><p key={project.id}><b>{project.title}</b><small>{getProjectStatusLabel(project)} • {getProjectProgress(project)}%</small></p>)}{!summary.memberProjects.length && <p>Belum mengikuti project.</p>}</section>
            <section className="iti-card"><h3>Task Terbaru</h3>{summary.assignedTasks.slice(0,6).map(({project, task})=><p key={task.id}><b>{task.title}</b><small>{project.title} • {getTaskReviewState(task).label}</small></p>)}{!summary.assignedTasks.length && <p>Belum ada task.</p>}</section>
          </div>
        </ItiModal>;
      })()}

      {modal?.type === "user" && <ItiModal title={modal.user ? "Edit Pengguna" : "Tambah Pengguna"} onClose={()=>setModal(null)}><form className="iti-form" onSubmit={saveUser}><input type="hidden" name="id" defaultValue={modal.user?.id || ""}/><ItiField label="Nama"><input name="name" required defaultValue={modal.user?.name || ""}/></ItiField><ItiField label="Email"><input name="email" type="email" defaultValue={modal.user?.email || userEmail(modal.user || {name:""})}/></ItiField><ItiField label="Nomor Telepon"><input name="phone" defaultValue={modal.user?.phone || ""}/></ItiField><ItiField label="Unit Kerja"><input name="unit" defaultValue={modal.user?.unit || "Akademik"}/></ItiField><ItiField label="Role"><select name="role" disabled={!!modal.user && !canChangeRole(currentUser)} defaultValue={modal.user?.role || creatableRoles[0] || ROLES.USER}>{(modal.user ? (canChangeRole(currentUser) ? Object.values(ROLES) : [modal.user.role]) : creatableRoles).map((role)=><option key={role} value={role}>{roleLabel(role)}</option>)}</select></ItiField><ItiField label="Status"><select name="status" defaultValue={modal.user?.status || "active"}><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></ItiField><div className="iti-modal-actions"><ItiButton onClick={()=>setModal(null)}>Batal</ItiButton><ItiButton className="primary" type="submit">Simpan</ItiButton></div></form></ItiModal>}
    </div>
  );
}

function ItiProjectsPage({ currentUser, users, projects, setProjects, openProject, searchQuery, archivedProjectIds = [], setArchivedProjectIds, showToast, logActivity, initialStatus = "all", initialSort = "deadline" }) {
  const [modal, setModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState(initialStatus || "all");
  const [sortBy, setSortBy] = useState(initialSort || "deadline");
  useEffect(() => { setStatusFilter(initialStatus || "all"); setSortBy(initialSort || "deadline"); }, [initialStatus, initialSort, currentUser.id]);
  const baseProjects = getVisibleProjects(currentUser, projects, users).filter((p) => !archivedProjectIds.includes(p.id)).filter((p) => projectMatchesSearch(p, users, searchQuery));
  const visible = baseProjects.filter((p) => statusFilter === "all" || (statusFilter === "review" ? p.tasks.some((t)=>(t.completionProof?.submissions||[]).some((sub)=>sub.status==="submitted") && !isTaskFullyCompleted(t)) : getProjectStatus(p) === statusFilter)).sort((a,b)=> sortBy === "deadline" ? new Date(a.deadlineAt)-new Date(b.deadlineAt) : new Date(b.createdAt)-new Date(a.createdAt));
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  useEffect(() => { setPage(1); }, [statusFilter, sortBy, searchQuery, currentUser.id]);
  const cards = visible.slice((page - 1) * pageSize, page * pageSize);
  const statusCount = (status) => baseProjects.filter((p) => getProjectStatus(p) === status).length;
  const assignableUsers = getAssignableUsers(currentUser, users);

  function saveProject(event) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const id = fd.get("id");
    const assignedTo = fd.getAll("assignedTo");
    const ownerId = fd.get("ownerId") || modal.project?.ownerId || modal.project?.createdBy || currentUser.id;
    const managerIds = fd.getAll("managerIds").filter(Boolean);
    const payload = { title: fd.get("title")?.trim() || "Project Baru", description: fd.get("description")?.trim() || "", deadlineAt: fd.get("deadlineAt"), unit: fd.get("unit")?.trim() || "Akademik", status: fd.get("status") || "running", assignedTo: Array.from(new Set([currentUser.id, ownerId, ...managerIds, ...assignedTo].filter(Boolean))), ownerId, managerIds };
    if (!id && !canCreateProject(currentUser)) return showToast("Akses ditolak", "Role Anda tidak dapat membuat project.", "danger");
    if (id && modal.project) {
      const oldMembers = getProjectAssigneeIds(modal.project);
      const removedMembers = oldMembers.filter((userId) => !payload.assignedTo.includes(userId));
      const blockerTasks = (modal.project.tasks || []).filter((task) => !isTaskFullyCompleted(task) && (getTaskAssigneeIds(task).some((userId) => removedMembers.includes(userId)) || removedMembers.includes(task.createdBy)));
      if (blockerTasks.length) return showToast("Anggota belum bisa dihapus", `Pindahkan dulu ${blockerTasks.length} task aktif agar tidak ada pekerjaan menggantung.`, "danger");
    }
    setProjects((list) => id ? list.map((project)=>project.id===id?{...project,...payload}:project) : [{ id: makeId("p"), createdBy: currentUser.id, createdAt: nowIso(), tasks: [], ...payload }, ...list]);
    logActivity(id ? "Project diperbarui" : "Project dibuat", payload.title);
    showToast(id ? "Project diperbarui" : "Project dibuat", payload.title);
    setModal(null);
  }
  function deleteProject(project) { if (!canDeleteProject(currentUser, project)) return showToast("Akses ditolak", "Anda tidak dapat menghapus project ini.", "danger"); if (!confirmAction(`Hapus project ${project.title}?`)) return; setProjects((list)=>list.filter((item)=>item.id!==project.id)); logActivity("Project dihapus", project.title); showToast("Project dihapus", project.title); }
  function archiveProject(project) { if (!canArchiveProject(currentUser, project)) return showToast("Belum bisa diarsipkan", "Project hanya boleh diarsipkan jika semua task sudah verified selesai dan Anda punya akses arsip.", "danger"); setArchivedProjectIds((ids)=>Array.from(new Set([...ids, project.id]))); logActivity("Project diarsipkan", project.title); showToast("Project diarsipkan", project.title); }

  return <div className="iti-page"><ItiSectionTitle icon="project" title="Daftar Project" subtitle="Kelola dan pantau seluruh project di lingkungan Institut Teknologi Indonesia." action={canCreateProject(currentUser) && <ItiButton className="primary" icon="plus" onClick={()=>setModal({type:"project"})}>Buat Project</ItiButton>} />
    <div className="iti-stat-row five"><ItiMiniStat title="Total Project" value={baseProjects.length} icon="project" tone="blue" onClick={()=>setStatusFilter("all")} /><ItiMiniStat title="Berjalan" value={statusCount("running")} icon="clock" tone="orange" onClick={()=>setStatusFilter("running")} /><ItiMiniStat title="Dalam Review" value={baseProjects.filter((p)=>p.tasks.some((t)=>(t.completionProof?.submissions||[]).some((sub)=>sub.status==="submitted") && !isTaskFullyCompleted(t))).length} icon="clock" tone="yellow" onClick={()=>setStatusFilter("review")} /><ItiMiniStat title="Selesai" value={statusCount("completed")} icon="check" tone="green" onClick={()=>setStatusFilter("completed")} /><ItiMiniStat title="Lewat Deadline" value={statusCount("overdue")} icon="alert" tone="red" onClick={()=>setStatusFilter("overdue")} /></div>
    <div className="iti-filter-bar"><ItiField label="Status"><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}><option value="all">Semua Status</option><option value="running">Berjalan</option><option value="review">Dalam Review</option><option value="completed">Selesai</option><option value="overdue">Lewat Deadline</option></select></ItiField><ItiField label="Urutkan"><select value={sortBy} onChange={(e)=>setSortBy(e.target.value)}><option value="deadline">Deadline Terdekat</option><option value="newest">Terbaru</option></select></ItiField><ItiButton icon="refresh" onClick={()=>{setStatusFilter("all");setSortBy("deadline")}}>Reset Filter</ItiButton></div>
    <div className="iti-project-grid">{cards.map((project, index) => <article key={project.id} className="iti-project-card"><div><ItiProjectIcon index={index} /><button type="button" onClick={()=>openProject(project.id)}><Icon name="external" /></button></div><h3>{project.title}</h3><p>{project.description}</p><small>Pemilik <b>{getUserName(users, getProjectOwnerId(project))}</b></small><small>Tim {getProjectAssigneeIds(project).slice(0,3).map((id) => <ItiAvatar key={id} name={getUserName(users, id)} size="xs" />)} <em>{getProjectAssigneeIds(project).length} orang</em></small><small>Deadline <b>{formatDate(project.deadlineAt)}</b></small><div className="project-card-foot"><strong>{getProjectProgress(project)}%</strong><i><b style={{width: `${getProjectProgress(project)}%`}} /></i><span>{getProjectStatusLabel(project)}</span></div><div className="iti-card-actions"><button onClick={()=>openProject(project.id)}>Detail</button>{canEditProject(currentUser, project)&&<button onClick={()=>setModal({type:"project", project})}>Edit</button>}{canArchiveProject(currentUser, project)&&<button onClick={()=>archiveProject(project)}>Arsipkan</button>}{canDeleteProject(currentUser, project)&&<button onClick={()=>deleteProject(project)}>Hapus</button>}</div></article>)}</div>
    <div className="iti-pagination project-pagination"><span>Menampilkan {visible.length ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, visible.length)} dari {visible.length} project</span><div><button disabled={page<=1} onClick={()=>setPage(page-1)}>‹</button>{Array.from({length: pageCount}, (_,i)=>i+1).slice(Math.max(0, Math.min(page - 6, pageCount - 12)), Math.min(pageCount, Math.max(12, page + 6))).map((num)=><button key={num} className={page===num?"active":""} onClick={()=>setPage(num)}>{num}</button>)}<button disabled={page>=pageCount} onClick={()=>setPage(page+1)}>›</button></div></div>
    <section className="iti-wide-card"><div className="iti-card-head"><strong>Deadline & Milestone Mendatang</strong><button onClick={()=>setStatusFilter("overdue")}>Lihat Terlambat</button></div><div className="iti-milestones">{visible.slice(0,5).map((project,i)=><div key={project.id}><b>{new Date(project.deadlineAt).getDate()}<small>{new Date(project.deadlineAt).toLocaleDateString("id-ID",{month:"short"})}</small></b><span>{project.title}<small>{getProjectStatus(project)}</small></span><em>{formatDate(project.deadlineAt).split(" pukul")[0]}</em></div>)}</div></section>
    {modal?.type === "project" && <ItiModal title={modal.project ? "Edit Project" : "Buat Project"} onClose={()=>setModal(null)}><form className="iti-form" onSubmit={saveProject}><input type="hidden" name="id" defaultValue={modal.project?.id || ""}/><ItiField label="Judul Project"><input name="title" required defaultValue={modal.project?.title || ""}/></ItiField><ItiField label="Deskripsi"><textarea name="description" defaultValue={modal.project?.description || ""}/></ItiField><ItiField label="Deadline"><input name="deadlineAt" type="datetime-local" required defaultValue={modal.project?.deadlineAt || toDatetimeLocal(addDays(new Date(), 14))}/></ItiField><ItiField label="Unit/Kategori"><input name="unit" defaultValue={modal.project?.unit || "Akreditasi"}/></ItiField><ItiField label="Status Project"><select name="status" defaultValue={modal.project?.status || getProjectStatus(modal.project || {tasks:[], deadlineAt: toDatetimeLocal(addDays(new Date(), 14))})}><option value="draft">Draft</option><option value="running">Berjalan</option><option value="review">Dalam Review</option><option value="completed">Selesai</option></select></ItiField>{currentUser.role === ROLES.SUPER_ADMIN && <ItiField label="Owner Project"><select name="ownerId" defaultValue={modal.project?.ownerId || modal.project?.createdBy || currentUser.id}>{assignableUsers.filter((user)=>[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MODERATOR].includes(user.role)).map((user)=><option key={user.id} value={user.id}>{user.name} — {roleLabel(user.role)}</option>)}</select></ItiField>}<div className="iti-check-grid"><span>Manager Project</span>{assignableUsers.filter((user)=>[ROLES.ADMIN, ROLES.MODERATOR].includes(user.role)).map((user)=><label key={`m-${user.id}`}><input type="checkbox" name="managerIds" value={user.id} defaultChecked={(modal.project?.managerIds || []).includes(user.id)} /> {user.name} <small>{roleLabel(user.role)}</small></label>)}</div><div className="iti-check-grid"><span>Assign ke tim</span>{assignableUsers.map((user)=><label key={user.id}><input type="checkbox" name="assignedTo" value={user.id} defaultChecked={(modal.project?.assignedTo || []).includes(user.id)} /> {user.name} <small>{roleLabel(user.role)}</small></label>)}</div><div className="iti-modal-actions"><ItiButton onClick={()=>setModal(null)}>Batal</ItiButton><ItiButton className="primary" type="submit">Simpan</ItiButton></div></form></ItiModal>}
  </div>;
}

function ItiProjectWorkspace({ project, currentUser, users, setProjects, close, showToast, logActivity, highlightedTaskId }) {
  const [modal, setModal] = useState(null);
  const [activeColumn, setActiveColumn] = useState("backlog");
  const progress = getProjectProgress(project);
  const visibleProjectTasks = project.tasks.filter((task) => canSeeTask(currentUser, task, project, users));
  const columnMap = {
    backlog: { label: "Backlog", tasks: visibleProjectTasks.filter((t)=>!isTaskFullyCompleted(t) && !(t.completionProof?.submissions||[]).some((s)=>s.status === "submitted")) },
    review: { label: "Review", tasks: visibleProjectTasks.filter((t)=>!isTaskFullyCompleted(t) && (t.completionProof?.submissions||[]).some((s)=>s.status === "submitted")) },
    selesai: { label: "Selesai", tasks: visibleProjectTasks.filter((t)=>isTaskFullyCompleted(t)) }
  };
  const currentColumn = columnMap[activeColumn] || columnMap.backlog;
  const assignableUsers = getProjectAssigneeIds(project).map((id)=>users.find((u)=>u.id===id)).filter(Boolean).filter((user)=>canAssignUser(currentUser, user));

  useEffect(() => {
    if (!highlightedTaskId) return;
    const task = visibleProjectTasks.find((item)=>item.id === highlightedTaskId);
    if (task) {
      if (isTaskFullyCompleted(task)) setActiveColumn("selesai");
      else if ((task.completionProof?.submissions || []).some((s)=>s.status === "submitted")) setActiveColumn("review");
      else setActiveColumn("backlog");
      setModal({ type: "detail", task });
    }
    window.setTimeout(() => {
      const node = document.getElementById(`task-${highlightedTaskId}`);
      if (node) { node.scrollIntoView({ behavior: "smooth", block: "center" }); node.classList.add("task-highlight-pulse"); window.setTimeout(() => node.classList.remove("task-highlight-pulse"), 2600); }
    }, 80);
  }, [highlightedTaskId, project.id]);

  function updateTask(taskId, updater) { setProjects((list)=>list.map((p)=>p.id===project.id?{...p,tasks:p.tasks.map((task)=>task.id===taskId?updater(task):task)}:p)); }
  async function saveTask(event) { event.preventDefault(); const fd=new FormData(event.currentTarget); const id=fd.get("id"); const files=await fileMetaListAsync(event.currentTarget.elements.instructionFiles?.files || []); const assignedTo=fd.getAll("assignedTo"); const finalAssignedTo = assignedTo.length?assignedTo:[currentUser.id]; if(finalAssignedTo.some((id)=>!getProjectAssigneeIds(project).includes(id))) return showToast("Assign tidak valid", "Task hanya boleh diberikan kepada anggota project.", "danger"); if(new Date(fd.get("deadlineAt")).getTime() > new Date(project.deadlineAt).getTime()) return showToast("Deadline tidak valid", "Deadline task tidak boleh melewati deadline project.", "danger"); const payload={title:fd.get("title")?.trim()||"Task Baru",description:fd.get("description")?.trim()||"",deadlineAt:fd.get("deadlineAt"),assignedTo:finalAssignedTo,instructionAttachments:files}; if(id){updateTask(id,(task)=>({...task,...payload,instructionAttachments:[...(task.instructionAttachments||[]),...files]}));}else{setProjects((list)=>list.map((p)=>p.id===project.id?{...p,tasks:[...p.tasks,{id:makeId("t"),createdBy:currentUser.id,createdAt:nowIso(),completedBy:{},isCompleted:false,completionProof:{note:"",links:[],files:[],submissions:[]},comments:[],...payload}]}:p));} logActivity(id?"Task diperbarui":"Task dibuat", payload.title, { projectId: project.id, taskId: id || null, userIds: finalAssignedTo.filter((uid)=>uid !== currentUser.id) }); showToast(id?"Task diperbarui":"Task dibuat", payload.title); setModal(null); }
  function deleteTask(task) { if(!canDeleteTask(currentUser, project, task)) return showToast("Akses ditolak","Hanya pembuat task, pembuat project, atau SUPERADMIN yang dapat menghapus task.","danger"); if(!confirmAction(`Hapus task ${task.title}?`)) return; setProjects((list)=>list.map((p)=>p.id===project.id?{...p,tasks:p.tasks.filter((t)=>t.id!==task.id)}:p)); logActivity("Task dihapus", `${task.title} - ${project.title}`); showToast("Task dihapus", task.title); }
  async function submitProof(event) { event.preventDefault(); const fd=new FormData(event.currentTarget); const task=modal.task; const submittedAt = nowIso(); const note=String(fd.get("note") || ""); const links=String(fd.get("links")||"").split("\n").map((v)=>v.trim()).filter(Boolean); const files=await fileMetaListAsync(event.currentTarget.elements.proofFiles?.files||[]); const latestExisting = getLatestSubmission(task); if (latestExisting?.submittedBy === currentUser.id && latestExisting?.status === "submitted") { const duplicateWindow = Math.abs(new Date(submittedAt).getTime() - new Date(latestExisting.submittedAt || 0).getTime()) < 8000; const samePayload = String(latestExisting.note || "") === note && JSON.stringify(latestExisting.links || []) === JSON.stringify(links); if (duplicateWindow && samePayload) return showToast("Submit ganda dicegah", "Bukti yang sama baru saja dikirim. Silakan tunggu proses review.", "danger"); } const submission = {id:makeId("proof"),submittedBy:currentUser.id,submittedAt,status:"submitted",reviewedBy:null,reviewedAt:null,note,links,files}; if(!canSubmitProof(currentUser, task)) return showToast("Akses ditolak", "Anda bukan penerima task ini atau task sudah verified.", "danger"); updateTask(task.id,(item)=>({...item, isCompleted:false, completedAt:null, reviewStatus:"submitted", completionProof:{...(item.completionProof||{}), submittedBy:currentUser.id, submittedAt, submissions:[submission, ...((item.completionProof?.submissions)||[])]}})); logActivity("Bukti task dikirim", `${task.title} - ${project.title} oleh ${currentUser.name}`, { projectId: project.id, taskId: task.id, userIds: [task.createdBy, getProjectOwnerId(project), ...getProjectManagerIds(project)].filter((id)=>id && id !== currentUser.id) }); showToast("Bukti dikirim", `${task.title} oleh ${currentUser.name}`); setActiveColumn("review"); setModal(null); }
  function reviewProof(task, approved) { if(!canReviewProof(currentUser, project, task)) return showToast("Akses ditolak","Anda tidak dapat review task ini.","danger"); const proof = task.completionProof || {submissions:[]}; const latest = getLatestSubmission(task); if (!latest) return showToast("Belum ada bukti", "Task belum memiliki submission untuk direview.", "danger"); if (latest.status !== "submitted") return showToast("Tidak ada review baru", "Hanya bukti berstatus Submitted yang bisa diverifikasi atau ditolak.", "danger"); const reviewNote = approved ? (window.prompt("Catatan approve/verifikasi (opsional):", "") || "") : window.prompt("Alasan penolakan wajib diisi:", ""); if (!approved && !String(reviewNote || "").trim()) return showToast("Alasan wajib", "Reject harus mencantumkan alasan penolakan yang jelas.", "danger"); const reviewedAt = nowIso(); updateTask(task.id,(item)=>{ const proof = item.completionProof || {submissions:[]}; const latestSubmissionId = latest?.id; const latestInItem = (proof.submissions || []).find((submission)=>submission.id === latestSubmissionId) || (proof.submissions || [])[0]; const submissions = (proof.submissions || []).map((submission, index)=> (latestSubmissionId ? submission.id === latestSubmissionId : index===0) ? {...submission,status:approved?"approved":"rejected",reviewedBy:currentUser.id,reviewedAt,reviewNote} : submission); const completedBy = {...(item.completedBy || {})}; if (latestInItem?.submittedBy) completedBy[latestInItem.submittedBy] = { isCompleted: approved, completedAt: approved ? reviewedAt : null, reviewedBy: currentUser.id, reviewNote }; return {...item, completedBy, isCompleted:approved, completedAt: approved ? reviewedAt : null, reviewStatus:approved?"approved":"rejected", reviewedBy: currentUser.id, reviewedAt, reviewNote, completionProof:{...proof, submissions}}; }); logActivity(approved?"Task diverifikasi":"Task ditolak", `${task.title} • ${currentUser.name}`, { projectId: project.id, taskId: task.id, userIds: getTaskAssigneeIds(task).filter((id)=>id !== currentUser.id) }); showToast(approved?"Task diverifikasi":"Task ditolak", `${task.title} • direview oleh ${currentUser.name}`); setActiveColumn(approved ? "selesai" : "backlog"); }
  function reopenTask(task) { if(!canReopenTask(currentUser, project, task)) return showToast("Akses ditolak", "Hanya SUPERADMIN, owner project, atau pembuat task yang dapat membuka ulang task.", "danger"); const reason = window.prompt("Alasan membuka ulang task wajib diisi:", ""); if(!String(reason || "").trim()) return showToast("Alasan wajib", "Task tidak dibuka ulang tanpa alasan.", "danger"); updateTask(task.id, (item) => ({...item, isCompleted:false, completedAt:null, reviewStatus:"reopened", reopenReason: reason, reopenedBy: currentUser.id, reopenedAt: nowIso()})); logActivity("Task dibuka ulang", `${task.title} • ${reason}`); showToast("Task dibuka ulang", task.title); setActiveColumn("backlog"); }
  function addTaskComment(event) { event.preventDefault(); const fd = new FormData(event.currentTarget); const task = modal.task; const body = String(fd.get("comment") || "").trim(); if(!body) return; if(!canCommentTask(currentUser, project, task)) return showToast("Akses ditolak", "Hanya anggota project yang bisa komentar.", "danger"); const newComment = {id:makeId("comment"), body, createdBy:currentUser.id, createdAt:nowIso()}; updateTask(task.id, (item) => ({...item, comments:[newComment, ...(item.comments || [])]})); logActivity("Komentar task", `${task.title} • ${currentUser.name}`, { projectId: project.id, taskId: task.id, userIds: Array.from(new Set([task.createdBy, getProjectOwnerId(project), ...getTaskAssigneeIds(task)])).filter((id)=>id !== currentUser.id) }); showToast("Komentar ditambahkan", task.title); setModal({type:"detail", task:{...task, comments:[newComment, ...(task.comments || [])]}}); }
  function deleteTaskComment(task, comment) { if(!canDeleteComment(currentUser, project, task, comment)) return showToast("Akses ditolak", "Anda tidak bisa menghapus komentar ini.", "danger"); const nextComments = (task.comments || []).filter((c)=>c.id !== comment.id); updateTask(task.id, (item) => ({...item, comments:(item.comments || []).filter((c)=>c.id !== comment.id), commentLogs:[{id:makeId("clog"), action:"comment_deleted", commentBody:comment.body, deletedBy:currentUser.id, deletedAt:nowIso()}, ...(item.commentLogs || [])]})); logActivity("Komentar dihapus", `${task.title} • ${currentUser.name}`); showToast("Komentar dihapus", task.title); setModal({type:"detail", task:{...task, comments:nextComments}}); }
  const renderTask = (task) => <article id={`task-${task.id}`} key={task.id} className={`iti-task-card iti-task-list-card ${highlightedTaskId === task.id ? "is-highlighted" : ""}`}><div className="task-main-line"><strong>{task.title}</strong><em>{getTaskReviewState(task).label}</em></div><p>{task.description}</p><div className="task-meta-grid"><small>Dibuat oleh: <b>{getUserName(users, task.createdBy || project.createdBy)}</b></small><small>Assign: {getTaskAssigneeNames(users, task)}</small><small>Deadline: {formatDate(task.deadlineAt)}</small>{getLatestSubmission(task) && <small>Submit terbaru: <b>{getTaskSubmitterLabel(users, task)}</b></small>}</div>{(task.instructionAttachments||[]).length ? <ItiFileList files={task.instructionAttachments} title="Lampiran Instruksi" /> : null}<div className="iti-task-actions"><button onClick={()=>setModal({type:"detail", task})}>Detail</button>{canReviewProof(currentUser, project, task)&&getLatestSubmission(task)?.status === "submitted"&&!isTaskFullyCompleted(task)&&<button onClick={()=>reviewProof(task,true)}>Verified Checked</button>}{canReviewProof(currentUser, project, task)&&getLatestSubmission(task)?.status === "submitted"&&!isTaskFullyCompleted(task)&&<button onClick={()=>reviewProof(task,false)}>Reject</button>}{canSubmitProof(currentUser, task)&&<button onClick={()=>setModal({type:"proof",task})}>Submit Bukti</button>}{canReopenTask(currentUser, project, task)&&<button onClick={()=>reopenTask(task)}>Buka Ulang</button>}{canDeleteTask(currentUser, project, task)&&<button onClick={()=>deleteTask(task)}>Hapus</button>}</div></article>;

  return <div className={`iti-page iti-workspace-page ${highlightedTaskId ? "is-task-focus" : ""}`}><div className="iti-breadcrumb"><button onClick={close}>Project</button><span>›</span><span>Workspace</span><span>›</span><strong>{project.title}</strong></div><section className="iti-workspace-head"><ItiProjectIcon index={0}/><div><h2>{project.title}</h2><p>{project.description}</p></div>{canAddTask(currentUser, project) && <ItiButton className="primary" icon="plus" onClick={()=>setModal({type:"task"})}>Tambah Tugas</ItiButton>}</section><div className="iti-workspace-meta"><div><small>Progress</small><ItiProgressRing value={progress} label="Project" /></div><div><small>Owner</small><b>{getUserName(users, getProjectOwnerId(project))}</b></div><div><small>Tim</small>{getProjectAssigneeIds(project).map((id)=><ItiAvatar key={id} name={getUserName(users,id)} size="xs" />)}</div><div><small>Due Date</small><b>{formatDate(project.deadlineAt)}</b></div><div><small>Status</small><em className={getProjectStatus(project)==="overdue"?"status off":"status"}>{getProjectStatus(project)}</em></div></div><div className="iti-workspace-layout"><div className="iti-workspace-main"><div className="workspace-tabs">{Object.entries(columnMap).map(([id,col])=><button type="button" key={id} className={activeColumn===id?"active":""} onClick={()=>setActiveColumn(id)}>{col.label}<span>{col.tasks.length}</span></button>)}</div><section className="workspace-task-list"><div className="iti-card-head"><strong>{currentColumn.label}</strong><small>{currentColumn.tasks.length} task</small></div>{currentColumn.tasks.map(renderTask)}{!currentColumn.tasks.length && <div className="empty-column"><Icon name="tasks" /><b>Belum ada task di {currentColumn.label}</b><small>Gunakan tab di atas untuk pindah status atau tambah tugas baru.</small></div>}{canAddTask(currentUser, project)&&<button className="add-task wide" onClick={()=>setModal({type:"task"})}>+ Tambah Tugas</button>}</section></div><aside className="iti-side-stack"><section className="iti-card"><h3>Deskripsi Project</h3><p>{project.description}</p></section><section className="iti-card"><h3>Dokumen Terkait</h3>{visibleProjectTasks.flatMap((t)=>t.instructionAttachments||[]).slice(0,5).map((d,i)=><ItiFileList key={i} files={[d]} title="" />)}{!visibleProjectTasks.some((t)=>(t.instructionAttachments||[]).length)&&<p>Belum ada dokumen.</p>}</section><section className="iti-card"><h3>Aktivitas Terbaru</h3>{visibleProjectTasks.slice(0,4).map((t)=><p key={t.id}><em className={isTaskFullyCompleted(t)?"status":"status off"}>{isTaskFullyCompleted(t)?"✓":"•"}</em> {t.title}</p>)}</section></aside></div>{modal?.type==="task"&&<ItiModal title={modal.task?"Edit Task":"Tambah Task"} onClose={()=>setModal(null)}><form className="iti-form" onSubmit={saveTask}><input type="hidden" name="id" defaultValue={modal.task?.id||""}/><ItiField label="Judul Task"><input name="title" required defaultValue={modal.task?.title||""}/></ItiField><ItiField label="Deskripsi"><textarea name="description" defaultValue={modal.task?.description||""}/></ItiField><ItiField label="Deadline"><input type="datetime-local" name="deadlineAt" required defaultValue={modal.task?.deadlineAt||toDatetimeLocal(addDays(new Date(),7))}/></ItiField><div className="iti-check-grid"><span>Assign ke</span>{assignableUsers.map((user)=><label key={user.id}><input type="checkbox" name="assignedTo" value={user.id} defaultChecked={(modal.task?.assignedTo||[]).includes(user.id)}/> {user.name}</label>)}</div><ItiField label="File/Gambar Instruksi"><input type="file" name="instructionFiles" multiple /></ItiField><div className="iti-modal-actions"><ItiButton onClick={()=>setModal(null)}>Batal</ItiButton><ItiButton className="primary" type="submit">Simpan</ItiButton></div></form></ItiModal>}{modal?.type==="proof"&&<ItiModal title="Kirim Bukti Pekerjaan" onClose={()=>setModal(null)}><form className="iti-form" onSubmit={submitProof}><ItiField label="Catatan"><textarea name="note" required inputMode="text" placeholder="Tulis catatan. Angka, simbol, dan enter bisa digunakan. Contoh: Progress 80%, revisi tahap 2 selesai." /></ItiField><ItiField label="Link Bukti"><textarea name="links" placeholder="Satu link per baris" /></ItiField><ItiField label="File/Gambar Bukti"><input type="file" name="proofFiles" multiple /></ItiField><div className="iti-modal-actions"><ItiButton onClick={()=>setModal(null)}>Batal</ItiButton><ItiButton className="primary" type="submit">Kirim</ItiButton></div></form></ItiModal>}{modal?.type==="detail"&&<ItiModal title={`Detail Task: ${modal.task.title}`} onClose={()=>setModal(null)}><div className="iti-task-detail"><p><b>Dibuat oleh:</b> {getUserName(users, modal.task.createdBy || getProjectOwnerId(project))}</p><p><b>Assigned:</b> {getTaskAssigneeNames(users, modal.task)}</p><p><b>Status:</b> {getTaskReviewState(modal.task).label}</p><ItiFileList files={modal.task.instructionAttachments || []} title="Lampiran Instruksi" /><h4>Submit Terbaru</h4>{getLatestSubmission(modal.task)?<p>{getTaskSubmitterLabel(users, modal.task)}<br/>{getLatestSubmission(modal.task).note}</p>:<p>Belum ada submit.</p>}<ItiFileList files={getLatestSubmission(modal.task)?.files || []} title="File Submit Terbaru" />{(getLatestSubmission(modal.task)?.links || []).length ? <div className="proof-links"><h4>Link Submit</h4>{getLatestSubmission(modal.task).links.map((link)=><a key={link} href={link} target="_blank" rel="noreferrer">{link}</a>)}</div> : null}<h4>Riwayat Submit</h4>{(modal.task.completionProof?.submissions||[]).map((submission)=><div className="proof-history" key={submission.id}><b>{getUserName(users, submission.submittedBy)} • {proofStatusLabel(submission.status)}</b><small>{formatDate(submission.submittedAt)}</small><p>{submission.note || "-"}</p>{submission.reviewNote&&<p><b>Catatan Review:</b> {submission.reviewNote}</p>}<ItiFileList files={submission.files || []} title="File Riwayat" /></div>)}<h4>Komentar</h4><form className="comment-inline-form" onSubmit={addTaskComment}><textarea name="comment" required placeholder="Tulis komentar..." /><button type="submit">Kirim</button></form><div className="comment-list">{(modal.task.comments||[]).map((comment)=><div key={comment.id} className="comment-item"><b>{getUserName(users, comment.createdBy)}</b><small>{formatDate(comment.createdAt)}</small><p>{comment.body}</p>{canDeleteComment(currentUser, project, modal.task, comment)&&<button className="comment-delete" onClick={()=>deleteTaskComment(modal.task, comment)}>Hapus</button>}</div>)}{!modal.task.comments?.length&&<p>Belum ada komentar.</p>}</div></div></ItiModal>}</div>;
}


function ItiArchivePage({ currentUser, users, projects, archivedProjectIds = [], setArchivedProjectIds, setProjects, openProject, showToast, logActivity }) {
  const rows = getVisibleProjects(currentUser, projects, users).filter((project) => archivedProjectIds.includes(project.id));
  function restore(project){ if(!canRestoreProject(currentUser, project)) return showToast("Akses ditolak", "Hanya SUPERADMIN atau pemilik project yang bisa restore.", "danger"); setArchivedProjectIds((ids)=>ids.filter((id)=>id!==project.id)); logActivity("Project dipulihkan", project.title); showToast("Project dipulihkan", project.title); }
  function hardDelete(project){ if(!canDeleteProject(currentUser, project)) return showToast("Akses ditolak","Anda tidak dapat menghapus project ini.","danger"); if(!confirmAction(`Hapus permanen ${project.title}?`)) return; setProjects((list)=>list.filter((p)=>p.id!==project.id)); setArchivedProjectIds((ids)=>ids.filter((id)=>id!==project.id)); showToast("Project dihapus permanen", project.title); }
  return <div className="iti-page"><ItiSectionTitle icon="file" title="Arsip Project" subtitle="Kelola project yang telah diarsipkan. Pulihkan project jika diperlukan atau hapus permanen untuk penyimpanan." /><div className="iti-stat-row four"><ItiMiniStat title="Total Diarsipkan" value={rows.length} icon="project" tone="blue"/><ItiMiniStat title="Dipulihkan Bulan Ini" value="0" icon="refresh" tone="green"/><ItiMiniStat title="Selesai (Diarsipkan)" value={rows.filter((p)=>getProjectStatus(p)==="completed").length} icon="check" tone="orange"/><ItiMiniStat title="Kapasitas Arsip" value={`${Math.max(0, rows.length*8).toFixed(1)} GB`} icon="file" tone="purple"/></div><div className="iti-split-layout"><section className="iti-table-card grow"><div className="iti-table archive"><div className="thead"><span>Project</span><span>Tanggal Selesai</span><span>Owner</span><span>Alasan Diarsipkan</span><span>Ukuran</span><span>Aksi</span></div>{rows.map((project,i)=><div className="tr" key={project.id}><span className="person"><ItiProjectIcon index={i}/><b>{project.title}</b><small>{projectUnit(project,i)}</small></span><span>{formatDate(project.deadlineAt)}</span><span>{getUserName(users, getProjectOwnerId(project))}</span><span>Selesai / disimpan arsip</span><span>{(5+i*3).toFixed(1)} GB</span><span className="iti-actions"><button title="Pulihkan" onClick={()=>restore(project)}><Icon name="refresh"/></button><button title="Lihat" onClick={()=>openProject(project.id)}><Icon name="external"/></button><button title="Hapus permanen" onClick={()=>hardDelete(project)}><Icon name="trash"/></button></span></div>)}</div>{!rows.length&&<EmptyState text="Belum ada project yang diarsipkan." />}</section><aside className="iti-side-stack"><section className="iti-card storage"><h3>Penyimpanan Arsip</h3><ItiProgressRing value={Math.min(100, rows.length*8)} label="Arsip"/><p>Digunakan <b>{(rows.length*8).toFixed(1)} GB</b></p><p>Tersedia <b>{(200-rows.length*8).toFixed(1)} GB</b></p></section><section className="iti-card archive-retention"><h3>Retensi Arsip</h3><p><Icon name="clock"/> <span>Retensi otomatis 5 tahun.</span></p><p><Icon name="check"/> <span>Data lokal aman di browser tester.</span></p><p><Icon name="file"/> <span>Backup JSON untuk pindah perangkat.</span></p></section></aside></div></div>;
}

function ItiTasksPage({ currentUser, users, projects, setProjects, searchQuery, openProject, showToast, logActivity, initialStatus = "all" }) {
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const pageSize = 12;
  const baseItems = getVisibleProjects(currentUser, projects, users)
    .flatMap((project) => project.tasks.filter((task) => canSeeTask(currentUser, task, project, users) && taskMatchesSearch(task, project, users, searchQuery)).map((task) => ({ project, task })));
  const items = baseItems.filter(({task}) => {
    if (status === "all") return true;
    if (status === "active") return !isTaskFullyCompleted(task) && !(task.completionProof?.submissions||[]).some((sub)=>sub.status==="submitted") && !isPastDeadline(task.deadlineAt);
    if (status === "review") return (task.completionProof?.submissions||[]).some((sub)=>sub.status==="submitted") && !isTaskFullyCompleted(task);
    if (status === "completed") return isTaskFullyCompleted(task);
    if (status === "overdue") return !isTaskFullyCompleted(task) && isPastDeadline(task.deadlineAt);
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => { setPage(1); }, [status, searchQuery, currentUser.id]);
  const rows = items.slice((page - 1) * pageSize, page * pageSize);
  const done = baseItems.filter(({task})=>isTaskFullyCompleted(task)).length;
  const late = baseItems.filter(({task})=>!isTaskFullyCompleted(task)&&isPastDeadline(task.deadlineAt)).length;
  const activeCount = baseItems.filter(({task})=>!isTaskFullyCompleted(task)&&!(task.completionProof?.submissions||[]).some((sub)=>sub.status==="submitted")&&!isPastDeadline(task.deadlineAt)).length;
  const reviewCount = baseItems.filter(({task})=>(task.completionProof?.submissions||[]).some((sub)=>sub.status==="submitted")&&!isTaskFullyCompleted(task)).length;
  const recentSubmissions = [...baseItems]
    .filter(({ task }) => (task.completionProof?.submissions || []).length)
    .sort((a, b) => new Date(getLatestSubmission(b.task)?.submittedAt || 0) - new Date(getLatestSubmission(a.task)?.submittedAt || 0))
    .slice(0, 3);
  function toggleDone(project, task){ if(!canReviewProof(currentUser, project, task)) return showToast("Akses ditolak","Hanya pembuat task, pembuat project, atau SUPERADMIN yang dapat verified checked.","danger"); const latest = getLatestSubmission(task); if(latest?.status !== "submitted") return showToast("Belum ada bukti baru", "Task hanya bisa verified setelah ada submit bukti yang menunggu review.", "danger"); const reviewedAt = nowIso(); setProjects((list)=>list.map((p)=>p.id===project.id?{...p,tasks:p.tasks.map((t)=>t.id===task.id?{...t,completedBy:{...(t.completedBy||{}),[latest.submittedBy]:{isCompleted:true,completedAt:reviewedAt,reviewedBy:currentUser.id}},isCompleted:true,completedAt:reviewedAt,reviewStatus:"approved",reviewedBy:currentUser.id,reviewedAt,completionProof:{...(t.completionProof||{}),submissions:(t.completionProof?.submissions||[]).map((submission)=>submission.id===latest.id?{...submission,status:"approved",reviewedBy:currentUser.id,reviewedAt}:submission)}}:t)}:p)); logActivity("Task verified", task.title, { projectId: project.id, taskId: task.id, userIds: getTaskAssigneeIds(task).filter((id)=>id !== currentUser.id) }); showToast("Task verified", task.title); }
  const getPriorityTone = (task) => isPastDeadline(task.deadlineAt) ? "red" : isDueSoon(task.deadlineAt, 3) ? "yellow" : "green";
  const productivity = baseItems.length ? Math.round(done/baseItems.length*100) : 0;

  return <div className="iti-page"><ItiSectionTitle icon="tasks" title="Tugas Saya" subtitle="Kelola dan selesaikan tugas-tugas yang menjadi tanggung jawab Anda." action={<ItiButton icon="download" onClick={()=>exportRowsToCsv("tugas-saya.csv",["Task","Project","Deadline"],rows.map(({project,task})=>[task.title,project.title,formatDate(task.deadlineAt)]))}>Ekspor</ItiButton>} /><div className="iti-stat-row five"><ItiMiniStat title="Semua Tugas" value={baseItems.length} icon="file" tone="blue" onClick={()=>setStatus("all")}/><ItiMiniStat title="Aktif" value={activeCount} icon="clock" tone="orange" onClick={()=>setStatus("active")}/><ItiMiniStat title="Selesai" value={done} icon="check" tone="green" onClick={()=>setStatus("completed")}/><ItiMiniStat title="Perlu Review" value={reviewCount} icon="external" tone="yellow" onClick={()=>setStatus("review")}/><ItiMiniStat title="Terlambat" value={late} icon="alert" tone="red" onClick={()=>setStatus("overdue")}/></div><div className="iti-filter-bar"><ItiField label="Status"><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="all">Semua Status</option><option value="active">Aktif</option><option value="review">Perlu Review</option><option value="completed">Selesai</option><option value="overdue">Terlambat</option></select></ItiField><ItiButton icon="refresh" onClick={()=>setStatus("all")}>Reset Filter</ItiButton></div><div className="iti-split-layout"><section className="iti-table-card grow"><div className="iti-table tasks refined-task-table"><div className="thead"><span>Tugas</span><span>Project Terkait</span><span>Assigned By</span><span>Deadline</span><span>Progress</span><span>Status</span><span>Aksi</span></div>{rows.map(({project,task},i)=>{const c=getTaskCompletionCounts(task); const p=Math.round(c.completed/Math.max(1,c.total)*100); return <div className="tr" key={task.id}><span className="person"><ItiProjectIcon index={i}/><b>{task.title}</b><small>{task.description}</small></span><span>{project.title}</span><span>{getUserName(users, task.createdBy || project.createdBy)}<small className="submitter-line">Submit: {getTaskSubmitterLabel(users, task)}</small></span><span className={isPastDeadline(task.deadlineAt)&&!isTaskFullyCompleted(task)?'danger':''}>{formatDate(task.deadlineAt)}</span><span><b>{p}%</b><i className="mini-line"><b style={{width:`${p}%`}} /></i></span><span><em className={isTaskFullyCompleted(task)?'status':'status off'}>{getTaskReviewState(task).label}</em></span><span className="iti-actions"><button title="Detail" onClick={()=>setDetailItem({project, task})}><Icon name="external"/></button>{canReviewProof(currentUser, project, task) && getLatestSubmission(task)?.status === "submitted" && !isTaskFullyCompleted(task) && <button title="Verified Checked" onClick={()=>toggleDone(project,task)}><Icon name="check"/></button>}</span></div>})}</div><div className="iti-pagination task-pagination"><span>Menampilkan {items.length ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, items.length)} dari {items.length} tugas</span><div><button disabled={page<=1} onClick={()=>setPage(page-1)}>‹</button>{Array.from({length: pageCount}, (_,i)=>i+1).slice(Math.max(0, Math.min(page - 6, pageCount - 12)), Math.min(pageCount, Math.max(12, page + 6))).map((num)=><button key={num} className={page===num?"active":""} onClick={()=>setPage(num)}>{num}</button>)}<button disabled={page>=pageCount} onClick={()=>setPage(page+1)}>›</button></div></div></section><aside className="iti-side-stack"><section className="iti-card"><h3>Prioritas Hari Ini</h3><div className="task-side-list">{rows.slice(0,3).map(({task})=><div key={task.id} className="task-side-item"><span className={`priority-indicator ${getPriorityTone(task)}`}><Icon name={getPriorityTone(task) === "red" ? "alert" : getPriorityTone(task) === "yellow" ? "clock" : "check"}/></span><div><strong>{task.title}</strong><small>{formatDate(task.deadlineAt)}</small></div></div>)}</div></section><section className="iti-card"><h3>Pengumpulan Terbaru</h3><div className="task-side-list">{recentSubmissions.length ? recentSubmissions.map(({task})=><div key={task.id} className="task-side-item"><span className="priority-indicator blue"><Icon name="file"/></span><div><strong>{task.title}</strong><small>Bukti terkirim oleh {getUserName(users, getLatestSubmission(task)?.submittedBy)}</small></div></div>) : <p>Belum ada pengumpulan terbaru.</p>}</div></section><section className="iti-card productivity-card"><h3>Produktivitas Minggu Ini</h3><div className="productivity-bars"><div><span>Tercapai</span><strong>{productivity}%</strong></div><i className="mini-line"><b style={{width:`${productivity}%`}} /></i><small>Selesai <b>{done}</b> dari <b>{baseItems.length}</b> tugas</small></div></section></aside></div>{detailItem && <ItiModal title={`Detail Tugas: ${detailItem.task.title}`} onClose={()=>setDetailItem(null)}><div className="iti-task-detail"><p><b>Project:</b> {detailItem.project.title}</p><p><b>Dibuat oleh:</b> {getUserName(users, detailItem.task.createdBy || detailItem.project.createdBy)}</p><p><b>Penerima:</b> {getTaskAssigneeNames(users, detailItem.task)}</p><p><b>Status:</b> {getTaskReviewState(detailItem.task).label}</p><p><b>Deadline:</b> {formatDate(detailItem.task.deadlineAt)}</p><p><b>Deskripsi:</b> {detailItem.task.description || "-"}</p><ItiFileList files={detailItem.task.instructionAttachments || []} title="Lampiran Instruksi" />{getLatestSubmission(detailItem.task) ? <><h4>Submit Terbaru</h4><p>{getTaskSubmitterLabel(users, detailItem.task)}</p><p>{getLatestSubmission(detailItem.task).note}</p><ItiFileList files={getLatestSubmission(detailItem.task)?.files || []} title="File Bukti" /></> : <p>Belum ada bukti submit.</p>}<div className="iti-modal-actions"><ItiButton onClick={()=>setDetailItem(null)}>Tutup</ItiButton><ItiButton className="primary" icon="external" onClick={()=>openProject(detailItem.project.id, detailItem.task.id)}>Buka di Project</ItiButton></div></div></ItiModal>}</div>;
}

function ItiDeadlinePage({ currentUser, users, projects, setProjects, searchQuery, openProject, showToast, logActivity }) {
  const [modal, setModal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const visibleProjects = getVisibleProjects(currentUser, projects, users).filter((project) => projectMatchesSearch(project, users, searchQuery));
  const projectRows = visibleProjects.map((project) => ({ type: "project", project, task: null, title: project.title, description: project.description || "Deadline project", deadlineAt: project.deadlineAt, status: getProjectStatus(project) }));
  const taskRows = visibleProjects.flatMap((project) => project.tasks.filter((task) => canSeeTask(currentUser, task, project, users) && taskMatchesSearch(task, project, users, searchQuery)).map((task) => ({ type: "task", project, task, title: task.title, description: task.description || "Deadline task", deadlineAt: task.deadlineAt, status: getTaskReviewState(task).label })));
  const allRows = [...projectRows, ...taskRows].filter((row) => row.deadlineAt).sort((a,b)=>new Date(a.deadlineAt)-new Date(b.deadlineAt));
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const selectedRows = allRows.filter((row) => (row.deadlineAt || "").slice(0,10) === selectedDate);
  const displaySourceRows = selectedRows.length ? selectedRows : allRows;
  const pageCount = Math.max(1, Math.ceil(displaySourceRows.length / pageSize));
  useEffect(() => { setPage(1); }, [selectedDate, searchQuery, currentUser.id]);
  const rows = displaySourceRows.slice((page - 1) * pageSize, page * pageSize);
  const overdue = allRows.filter((row)=>isPastDeadline(row.deadlineAt) && (row.type === "project" ? row.status !== "completed" : !isTaskFullyCompleted(row.task))).length;
  const monthBase = new Date(selectedDate || Date.now());
  const calendarYear = monthBase.getFullYear();
  const calendarMonth = monthBase.getMonth();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells = Array.from({length: 42}, (_, i) => {
    const day = i - offset + 1;
    if (day < 1 || day > daysInMonth) return null;
    const dateKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const count = allRows.filter((row) => (row.deadlineAt || "").slice(0,10) === dateKey).length;
    return { day, dateKey, count };
  });
  function addDeadline(event){
    event.preventDefault();
    const fd=new FormData(event.currentTarget);
    const projectId=fd.get("projectId");
    const title=fd.get("title");
    const targetProject = projects.find((p)=>p.id === projectId);
    if(!targetProject || !canAddTask(currentUser, targetProject)) return showToast("Akses ditolak", "Anda harus menjadi anggota project dan bukan USER untuk membuat deadline task.", "danger");
    if(new Date(fd.get("deadlineAt")).getTime() > new Date(targetProject.deadlineAt).getTime()) return showToast("Deadline tidak valid", "Deadline task tidak boleh melewati deadline project.", "danger");
    setProjects((list)=>list.map((p)=>p.id===projectId?{...p,tasks:[...p.tasks,{id:makeId("t"),title,description:"Deadline baru",createdBy:currentUser.id,createdAt:nowIso(),assignedTo:[currentUser.id],deadlineAt:fd.get("deadlineAt"),isCompleted:false,completedBy:{},instructionAttachments:[],completionProof:{note:"",links:[],files:[],submissions:[]}, comments:[]}]}:p));
    logActivity("Deadline task dibuat", `${title} • ${targetProject.title}`, { projectId, userIds: Array.from(new Set([getProjectOwnerId(targetProject), ...getProjectManagerIds(targetProject), currentUser.id])).filter((id)=>id !== currentUser.id) });
    showToast("Deadline dibuat", title);
    setModal(null);
  }
  const openRow = (row) => row.type === "task" ? openProject(row.project.id, row.task.id) : openProject(row.project.id);
  return <div className="iti-page"><ItiSectionTitle icon="clock" title="Pusat Deadline" subtitle="Menampilkan gabungan deadline Project dan Task. Klik tanggal kalender untuk melihat deadline pada tanggal tersebut." action={<><ItiButton icon="download" onClick={()=>exportRowsToCsv("deadline.csv",["Tipe","Deadline","Project","Tanggal","Status"],rows.map((row)=>[row.type === "project" ? "Project" : "Task",row.title,row.project.title,formatDate(row.deadlineAt),row.status]))}>Ekspor</ItiButton>{currentUser.role!==ROLES.USER&&<ItiButton className="primary" icon="plus" onClick={()=>setModal({type:"deadline"})}>Tambah Deadline Task</ItiButton>}</>} />
  <div className="iti-stat-row four"><ItiMiniStat title="Deadline Hari Ini" value={allRows.filter((row)=>new Date(row.deadlineAt).toDateString()===new Date().toDateString()).length} icon="clock" tone="blue" onClick={()=>setSelectedDate(new Date().toISOString().slice(0,10))}/><ItiMiniStat title="3 Hari ke Depan" value={allRows.filter((row)=>isDueSoon(row.deadlineAt,3)).length} icon="clock" tone="green" onClick={()=>{const soon=allRows.find((row)=>isDueSoon(row.deadlineAt,3)); if(soon) setSelectedDate(new Date(soon.deadlineAt).toISOString().slice(0,10));}}/><ItiMiniStat title="Lewat Deadline" value={overdue} icon="alert" tone="red" onClick={()=>{const late=allRows.find((row)=>isPastDeadline(row.deadlineAt) && row.status!=="completed"); if(late) setSelectedDate(new Date(late.deadlineAt).toISOString().slice(0,10));}}/><ItiMiniStat title="Tanggal Dipilih" value={selectedRows.length} icon="file" tone="orange" onClick={()=>{}}/></div>
  <div className="iti-split-layout"><section className="iti-deadline-main"><div className="iti-calendar"><div className="iti-card-head"><strong>Kalender Deadline</strong><span>{monthBase.toLocaleDateString("id-ID",{month:"long",year:"numeric"})}</span></div><div className="calendar-grid">{"Sen Sel Rab Kam Jum Sab Min".split(" ").map(d=><b key={d}>{d}</b>)}{cells.map((cell, i)=> cell ? <button type="button" key={cell.dateKey} className={`${cell.dateKey === new Date().toISOString().slice(0,10) ? 'today' : ''} ${cell.dateKey === selectedDate ? 'selected' : ''} ${cell.count ? 'has-deadline' : ''}`} onClick={()=>setSelectedDate(cell.dateKey)}>{cell.day}<small>{cell.count ? `${cell.count} item` : ''}</small></button> : <button type="button" key={i} className="empty" disabled />)}</div></div>
  <section className="iti-table-card"><div className="iti-card-head"><strong>Deadline pada {new Date(selectedDate).toLocaleDateString("id-ID", { dateStyle: "full" })}</strong><small>{selectedRows.length} item</small></div><div className="iti-table deadlines"><div className="thead"><span>Judul Deadline</span><span>Tipe</span><span>Project</span><span>Penanggung Jawab</span><span>Tanggal</span><span>Status</span></div>{rows.map((row,i)=><button type="button" className="tr clickable-row" key={`${row.type}-${row.task?.id || row.project.id}`} onClick={()=>openRow(row)}><span className="person"><ItiProjectIcon index={i}/><b>{row.title}</b><small>{row.description}</small></span><span><em className={row.type === "project" ? "status" : "status off"}>{row.type === "project" ? "Project" : "Task"}</em></span><span>{row.project.title}</span><span>{row.type === "task" ? getUserName(users, row.task.createdBy || getProjectOwnerId(row.project)) : getUserName(users, getProjectOwnerId(row.project))}</span><span className={isPastDeadline(row.deadlineAt)&&row.status!=="completed"?'danger':''}>{formatDate(row.deadlineAt)}</span><span><em className={(row.type === "project" ? row.status === "completed" : isTaskFullyCompleted(row.task))?"status":"status off"}>{row.type === "project" ? row.status : row.status}</em></span></button>)}</div><div className="iti-pagination deadline-pagination"><span>Menampilkan {displaySourceRows.length ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, displaySourceRows.length)} dari {displaySourceRows.length} deadline</span><div><button disabled={page<=1} onClick={()=>setPage(page-1)}>‹</button>{Array.from({length: pageCount}, (_,i)=>i+1).slice(Math.max(0, Math.min(page - 6, pageCount - 12)), Math.min(pageCount, Math.max(12, page + 6))).map((num)=><button key={num} className={page===num?"active":""} onClick={()=>setPage(num)}>{num}</button>)}<button disabled={page>=pageCount} onClick={()=>setPage(page+1)}>›</button></div></div></section></section>
  <aside className="iti-side-stack"><section className="iti-card urgent"><h3>Deadline Urgent</h3>{rows.slice(0,5).map((row,i)=><button type="button" key={`${row.type}-u-${row.task?.id || row.project.id}`} onClick={()=>openRow(row)}><Icon name={i<2?'alert':'clock'}/><b>{row.project.title}</b><small>{row.type === "project" ? "Project" : row.title}</small><em>{formatDate(row.deadlineAt).split(" pukul")[0]}</em></button>)}</section><section className="iti-card deadline-kind"><h3>Jenis Deadline</h3><p><strong className="kind-project">Project</strong><span>Deadline utama project</span></p><p><strong className="kind-task">Task</strong><span>Deadline pekerjaan di dalam project</span></p></section><section className="iti-card quick"><h3>Tindakan Cepat</h3>{getVisibleProjects(currentUser, projects, users).some((p)=>canAddTask(currentUser,p)) && <button onClick={()=>setModal({type:"deadline"})}>Buat Deadline Task</button>}<button onClick={()=>showToast("Pengingat", "Notifikasi deadline, submit, review, reject, komentar, dan profil dicatat di localStorage.")}>Info Notifikasi</button></section></aside></div>{modal?.type==="deadline"&&<ItiModal title="Tambah Deadline Task" onClose={()=>setModal(null)}><form className="iti-form" onSubmit={addDeadline}><ItiField label="Pilih Project"><select name="projectId" required>{getVisibleProjects(currentUser, projects, users).filter((p)=>canAddTask(currentUser,p)).map((p)=><option key={p.id} value={p.id}>{p.title}</option>)}</select></ItiField><ItiField label="Judul Deadline"><input name="title" required /></ItiField><ItiField label="Tanggal"><input type="datetime-local" name="deadlineAt" required defaultValue={toDatetimeLocal(addDays(new Date(),3))}/></ItiField><div className="iti-modal-actions"><ItiButton onClick={()=>setModal(null)}>Batal</ItiButton><ItiButton className="primary" type="submit">Simpan</ItiButton></div></form></ItiModal>}</div>;
}


function ItiActivityLogPage({ currentUser, users, projects, activityLogs, searchQuery, openProject }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [localSearch, setLocalSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const pageSize = 14;
  const visibleProjectIds = new Set(getVisibleProjects(currentUser, projects, users).map((project) => project.id));
  const baseLogs = (Array.isArray(activityLogs) ? activityLogs : []).filter((log) => canSeeActivityLog(currentUser, users, log, visibleProjectIds));
  const query = normalizeSearch(searchQuery || localSearch);
  const filtered = baseLogs
    .filter((log) => typeFilter === "all" || getActivityTone(log.action) === typeFilter || normalizeSearch(log.action).includes(typeFilter))
    .filter((log) => !query || normalizeSearch(`${log.action} ${log.detail} ${getUserName(users, log.userId)} ${formatDate(log.createdAt)}`).includes(query));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => setPage(1), [typeFilter, query, currentUser.id]);
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const exportCsv = () => exportRowsToCsv("activity-log.csv", ["Waktu", "Aktor", "Role Aktor", "Aksi", "Detail", "Project", "Task"], filtered.map((log)=>{
    const actor = users.find((user)=>user.id===log.userId);
    return [formatDate(log.createdAt), getUserName(users, log.userId), roleLabel(actor?.role), log.action, log.detail, log.projectId || "Global", log.taskId || "-"];
  }));
  const selectedProject = selectedLog?.projectId ? projects.find((project)=>project.id===selectedLog.projectId) : null;
  const selectedTask = selectedProject && selectedLog?.taskId ? selectedProject.tasks.find((task)=>task.id===selectedLog.taskId) : null;
  const openSelectedLogTarget = () => {
    if (!selectedLog?.projectId) return;
    openProject(selectedLog.projectId, selectedLog.taskId || null);
    setSelectedLog(null);
  };
  return <div className="iti-page"><ItiSectionTitle icon="file" title="Activity Log" subtitle="Audit trail sesuai hierarki role. SUPERADMIN melihat semua, ADMIN tidak melihat SUPERADMIN, MODERATOR tidak melihat ADMIN/SUPERADMIN." action={<ItiButton icon="download" onClick={exportCsv}>Export CSV</ItiButton>} />
    <div className="iti-stat-row four"><ItiMiniStat title="Total Log" value={baseLogs.length} icon="file" tone="blue" onClick={()=>setTypeFilter("all")} /><ItiMiniStat title="Validasi" value={baseLogs.filter((l)=>getActivityTone(l.action)==="green").length} icon="check" tone="green" onClick={()=>setTypeFilter("green")} /><ItiMiniStat title="Butuh Perhatian" value={baseLogs.filter((l)=>getActivityTone(l.action)==="red").length} icon="alert" tone="red" onClick={()=>setTypeFilter("red")} /><ItiMiniStat title="Review/Deadline" value={baseLogs.filter((l)=>getActivityTone(l.action)==="yellow").length} icon="clock" tone="yellow" onClick={()=>setTypeFilter("yellow")} /></div>
    <div className="iti-filter-bar"><ItiField label="Cari Log"><input value={localSearch} onChange={(e)=>setLocalSearch(e.target.value)} placeholder="Cari aksi, detail, user..." /></ItiField><ItiField label="Kategori"><select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)}><option value="all">Semua</option><option value="green">Verified/Selesai</option><option value="yellow">Submit/Review/Deadline</option><option value="red">Hapus/Reject/Error</option><option value="blue">Lainnya</option></select></ItiField><ItiButton icon="refresh" onClick={()=>{setTypeFilter("all");setLocalSearch("");}}>Reset</ItiButton></div>
    <section className="iti-table-card activity-audit"><div className="iti-table activity-table"><div className="thead"><span>Waktu</span><span>Aktor</span><span>Aksi</span><span>Detail</span><span>Navigasi</span></div>{rows.map((log)=>{ const canOpen = Boolean(log.projectId); return <button type="button" className={`tr clickable-row activity-tone-${getActivityTone(log.action)} ${canOpen ? "has-link" : "has-detail"}`} key={log.id} onClick={()=>setSelectedLog(log)} title={canOpen ? "Klik untuk melihat detail dan membuka aktivitas terkait" : "Klik untuk melihat detail aktivitas"}><span className="activity-time">{formatDate(log.createdAt)}</span><span className="person"><ItiAvatar name={getUserName(users, log.userId)} size="xs"/><b>{getUserName(users, log.userId)}</b></span><span><em className="status">{log.action}</em></span><span className="activity-detail">{log.detail}</span><span>{canOpen ? <em className="open-chip">Lihat</em> : <small>Detail</small>}</span></button>})}</div>{!rows.length && <EmptyProfessionalState icon="file" title="Belum ada log" description="Aktivitas penting akan tercatat otomatis di sini sesuai akses role Anda." />}</section>
    <div className="iti-pagination"><span>Menampilkan {filtered.length ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, filtered.length)} dari {filtered.length} log</span><div><button disabled={page<=1} onClick={()=>setPage(page-1)}>‹</button>{Array.from({length: pageCount},(_,i)=>i+1).slice(Math.max(0,page-4), Math.min(pageCount, page+5)).map((num)=><button key={num} className={page===num?"active":""} onClick={()=>setPage(num)}>{num}</button>)}<button disabled={page>=pageCount} onClick={()=>setPage(page+1)}>›</button></div></div>
    {selectedLog && <ItiModal title="Detail Activity" onClose={()=>setSelectedLog(null)}><div className="activity-detail-modal"><p><span>Waktu</span><b>{formatDate(selectedLog.createdAt)}</b></p><p><span>Aktor</span><b>{getUserName(users, selectedLog.userId)} — {roleLabel(users.find((user)=>user.id===selectedLog.userId)?.role)}</b></p><p><span>Aksi</span><b>{selectedLog.action}</b></p><p><span>Detail</span><b>{selectedLog.detail}</b></p><p><span>Project</span><b>{selectedProject?.title || "Global / tidak terkait project"}</b></p>{selectedTask && <p><span>Task</span><b>{selectedTask.title}</b></p>}<div className="iti-modal-actions"><ItiButton onClick={()=>setSelectedLog(null)}>Tutup</ItiButton>{selectedLog.projectId && <ItiButton className="primary" icon="external" onClick={openSelectedLogTarget}>Buka Project/Task</ItiButton>}</div></div></ItiModal>}
  </div>;
}

function ItiNotificationsPage({ currentUser, users, notifications, setNotifications, openNotification, searchQuery }) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const query = normalizeSearch(searchQuery);
  const rows = notifications
    .filter((item)=>filter === "all" || (filter === "unread" ? !item.read : item.read))
    .filter((item)=>!query || normalizeSearch(`${item.title} ${item.message}`).includes(query));
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(()=>setPage(1), [filter, query, currentUser.id]);
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const markAll = () => setNotifications((list)=>list.map((item)=> rows.some((row)=>row.id===item.id) ? {...item, read:true} : item));
  const removeRead = () => setNotifications((list)=>list.filter((item)=>!item.read));
  const actorName = (item) => getUserName(users, item.createdBy);
  return <div className="iti-page"><ItiSectionTitle icon="bell" title="Pusat Notifikasi" subtitle="Semua notifikasi submit, review, reject, komentar, project, task, profil, dan deadline tersimpan di localStorage." action={<div className="button-row"><ItiButton icon="check" onClick={markAll}>Tandai Dibaca</ItiButton><ItiButton icon="trash" onClick={removeRead}>Bersihkan Terbaca</ItiButton></div>} />
    <div className="iti-stat-row compact"><ItiMiniStat title="Semua" value={notifications.length} icon="bell" tone="blue" onClick={()=>setFilter("all")} /><ItiMiniStat title="Belum Dibaca" value={notifications.filter((n)=>!n.read).length} icon="alert" tone="orange" onClick={()=>setFilter("unread")} /><ItiMiniStat title="Sudah Dibaca" value={notifications.filter((n)=>n.read).length} icon="check" tone="green" onClick={()=>setFilter("read")} /><ItiMiniStat title="Filter Aktif" value={filter === "all" ? "Semua" : filter === "unread" ? "Belum" : "Sudah"} icon="file" tone="purple" onClick={()=>setFilter("all")} /></div>
    <section className="iti-table-card activity-audit notification-audit"><div className="iti-table activity-table"><div className="thead"><span>Waktu</span><span>Aktor</span><span>Jenis</span><span>Detail</span><span>Navigasi</span></div>{pageRows.map((item)=><button type="button" key={item.id} className={`tr clickable-row has-link ${item.read ? "activity-tone-green" : "activity-tone-yellow"}`} onClick={()=>openNotification(item)}><span className="activity-time">{formatDate(item.createdAt)}</span><span className="person"><ItiAvatar name={actorName(item)} size="xs" /><b>{actorName(item)}</b><small>{item.read ? "Sudah dibaca" : "Belum dibaca"}</small></span><span><em className={item.read ? "status" : "status off"}>{item.title}</em></span><span className="activity-detail">{item.message}</span><span><i className="open-chip">{item.read ? "Buka lagi" : "Buka"}</i></span></button>)}</div>{!pageRows.length && <EmptyProfessionalState icon="bell" title="Tidak ada notifikasi" description="Notifikasi akan muncul saat ada submit, review, komentar, project, task, atau deadline." />}</section>
    <div className="iti-pagination"><span>Menampilkan {rows.length ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, rows.length)} dari {rows.length} notifikasi</span><div><button disabled={page<=1} onClick={()=>setPage(page-1)}>‹</button>{Array.from({length: pageCount},(_,i)=>i+1).slice(Math.max(0,page-4), Math.min(pageCount, page+5)).map((num)=><button key={num} className={page===num?"active":""} onClick={()=>setPage(num)}>{num}</button>)}<button disabled={page>=pageCount} onClick={()=>setPage(page+1)}>›</button></div></div>
  </div>;
}

function ItiProfilePage({ currentUser, setUsers, showToast, logActivity }) {
  const [modal, setModal] = useState(null);
  const notifications = currentUser.notifications || { projectEmail: true, taskEmail: true, deadlineReminder: true, dailySummary: false };
  function saveProfile(event){ event.preventDefault(); const fd=new FormData(event.currentTarget); setUsers((list)=>list.map((u)=>u.id===currentUser.id?{...u,name:fd.get("name"),email:fd.get("email"),phone:fd.get("phone"),unit:fd.get("unit")}:u)); logActivity("Profil diperbarui", currentUser.name); showToast("Profil diperbarui", "Data pengguna berhasil disimpan."); setModal(null); }
  function toggleNotification(key) {
    setUsers((list)=>list.map((u)=>u.id===currentUser.id?{...u, notifications:{...(u.notifications || notifications), [key]: !(u.notifications || notifications)[key]}}:u));
    showToast("Preferensi notifikasi diperbarui", "Pengaturan disimpan di localStorage.");
  }
  const Toggle = ({ label, keyName }) => <button type="button" className={`profile-toggle ${(currentUser.notifications || notifications)[keyName] ? "on" : "off"}`} onClick={()=>toggleNotification(keyName)}><span>{label}</span><em>{(currentUser.notifications || notifications)[keyName] ? "ON" : "OFF"}</em></button>;
  return <div className="iti-page"><ItiSectionTitle icon="users" title="Profil Saya" subtitle="Kelola informasi akun, keamanan, preferensi, dan notifikasi Anda." action={<ItiButton className="primary" icon="file" onClick={()=>setModal({type:"profile"})}>Edit Profil</ItiButton>} /><section className="iti-profile-hero"><ItiAvatar name={currentUser.name} size="xl"/><div><h2>{currentUser.name}</h2><Badge role={currentUser.role}/><p>✉ {userEmail(currentUser)}</p><p>☎ {currentUser.phone || "+62 812-3456-7890"}</p><p>🏛 Institut Teknologi Indonesia</p><p>🗓 Bergabung sejak 12 Januari 2023</p></div><dl><dt>Unit Kerja</dt><dd>{currentUser.unit || "Direktorat Teknologi Informasi"}</dd><dt>Jabatan</dt><dd>{roleLabel(currentUser.role)}</dd><dt>Lokasi</dt><dd>Serpong, Tangerang Selatan</dd><dt>ID Pengguna</dt><dd>{currentUser.id}</dd></dl></section><div className="iti-profile-grid"><section className="iti-card"><h3>Informasi Akun</h3><p>Nama Lengkap <b>{currentUser.name}</b></p><p>Email <b>{userEmail(currentUser)}</b></p><p>Unit Kerja <b>{currentUser.unit || "Direktorat Teknologi Informasi"}</b></p><p>Alamat Kantor <b>Kampus ITI, Serpong</b></p></section><section className="iti-card"><h3>Keamanan</h3><p>Password Terakhir Diubah <b>Hari ini</b></p><p>Autentikasi Dua Faktor <em className="status">Aktif</em></p><p>Sesi Aktif <b>1 perangkat</b></p><button onClick={()=>showToast("Perangkat aktif", "Chrome di Windows")}>Kelola Perangkat Aktif</button></section><section className="iti-card"><h3>Preferensi Tampilan</h3><p>Bahasa <b>Bahasa Indonesia</b></p><p>Zona Waktu <b>(WIB) Asia/Jakarta</b></p><p>Tema <b>Terang</b></p><p>Kepadatan <b>Nyaman</b></p></section><section className="iti-card"><h3>Notifikasi</h3><Toggle label="Email Notifikasi Project" keyName="projectEmail" /><Toggle label="Email Notifikasi Tugas" keyName="taskEmail" /><Toggle label="Pengingat Deadline" keyName="deadlineReminder" /><Toggle label="Ringkasan Harian" keyName="dailySummary" /><small>Toggle ini aktif sebagai preferensi frontend dan tersimpan di localStorage.</small></section><section className="iti-card"><h3>Aktivitas Terbaru</h3><p>Login demo aktif <small>Baru saja</small></p><p>Backup dan restore aktif <small>LocalStorage</small></p><p>Notifikasi deadline aktif <small>In-app</small></p></section><section className="iti-card"><h3>Informasi Sistem</h3><p>Versi Aplikasi <b>v2.4.1</b></p><p>Mode Data <em className="status">LocalStorage</em></p><p>Database <b>Browser Storage</b></p><p>Status <b>Siap test</b></p></section></div>{modal?.type==="profile"&&<ItiModal title="Edit Profil" onClose={()=>setModal(null)}><form className="iti-form" onSubmit={saveProfile}><ItiField label="Nama"><input name="name" required defaultValue={currentUser.name}/></ItiField><ItiField label="Email"><input name="email" type="email" defaultValue={userEmail(currentUser)}/></ItiField><ItiField label="Telepon"><input name="phone" defaultValue={currentUser.phone || ""}/></ItiField><ItiField label="Unit"><input name="unit" defaultValue={currentUser.unit || "Direktorat Teknologi Informasi"}/></ItiField><div className="iti-password-box"><strong>Ubah Password Demo</strong><p>Frontend LocalStorage belum memakai autentikasi backend. Password demo bisa dicatat di sini untuk simulasi profil.</p><input name="passwordDemo" type="password" placeholder="Password baru (simulasi)" /></div><div className="iti-modal-actions"><ItiButton onClick={()=>setModal(null)}>Batal</ItiButton><ItiButton className="primary" type="submit">Simpan</ItiButton></div></form></ItiModal>}</div>;
}

export default function App() {
  const [users, setUsers] = useState(() => {
    const storedUsers = readStorage(USERS_KEY, seedUsers);
    return Array.isArray(storedUsers) && storedUsers.length ? storedUsers : seedUsers;
  });
  const [projects, setProjects] = useState(() => normalizeProjects(readInitialProjects()));
  const [activeUserId, setActiveUserId] = useState(() => localStorage.getItem(ACTIVE_USER_KEY) || "u_super");
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskPagePreset, setTaskPagePreset] = useState({ filter: "all", deadline: "all", assignee: "all" });
  const [projectPagePreset, setProjectPagePreset] = useState({ status: "all", sort: "deadline", deadline: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [archivedProjectIds, setArchivedProjectIds] = useState(() => readStorage(ARCHIVED_PROJECTS_KEY, []));
  const [activityLogs, setActivityLogs] = useState(() => readStorage(ACTIVITY_LOGS_KEY, []));
  const [appNotifications, setAppNotifications] = useState(() => readStorage(NOTIFICATIONS_KEY, []).filter((item) => Date.now() - new Date(item.createdAt || 0).getTime() < 30 * 24 * 60 * 60 * 1000));
  const [toasts, setToasts] = useState([]);

  const currentUser = useMemo(() => users.find((user) => user.id === activeUserId) || users[0], [activeUserId, users]);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const headerFollowUpTasks = useMemo(
    () => getVisibleTasks(
      currentUser,
      getVisibleProjects(currentUser, projects, users).filter((project) => !archivedProjectIds.includes(project.id)),
      users
    )
      .filter((task) => !isTaskFullyCompleted(task) && isDueSoon(task.deadlineAt, 7))
      .sort((a, b) => new Date(a.deadlineAt || "2999-12-31").getTime() - new Date(b.deadlineAt || "2999-12-31").getTime())
      .slice(0, 8),
    [currentUser, projects, users, archivedProjectIds]
  );

  const visibleNotifications = useMemo(() => appNotifications.filter((notif) => {
    const targetIds = notif.userIds || [];
    if (notif.userId === "all" || (!notif.userId && !targetIds.length)) return true;
    if (targetIds.includes(currentUser.id)) return true;
    if (notif.userId && notif.userId === currentUser.id) return true;
    return false;
  }), [appNotifications, currentUser.id]);

  const headerKpis = useMemo(() => {
    if (activePage === "dashboard" || selectedProjectId) return [];
    const visibleProjects = getVisibleProjects(currentUser, projects, users);
    const workingProjects = visibleProjects.filter((project) => !archivedProjectIds.includes(project.id));
    const archivedProjects = visibleProjects.filter((project) => archivedProjectIds.includes(project.id));
    const tasks = getVisibleTasks(currentUser, workingProjects, users);
    const visibleProjectIds = new Set(workingProjects.map((project) => project.id));
    const logs = (Array.isArray(activityLogs) ? activityLogs : []).filter((log) => canSeeActivityLog(currentUser, users, log, visibleProjectIds));
    const visibleUsers = getVisibleUsers(currentUser, users);
    const activeTasks = tasks.filter((task) => !isTaskFullyCompleted(task) && getTaskReviewState(task).tone === "active").length;
    const reviewTasks = tasks.filter((task) => getTaskReviewState(task).tone === "review").length;
    const completedTasks = tasks.filter((task) => isTaskFullyCompleted(task)).length;
    const overdueTasks = tasks.filter((task) => !isTaskFullyCompleted(task) && isPastDeadline(task.deadlineAt)).length;
    const dueToday = tasks.filter((task) => !isTaskFullyCompleted(task) && new Date(task.deadlineAt).toDateString() === new Date().toDateString()).length;
    const dueSoon = tasks.filter((task) => !isTaskFullyCompleted(task) && isDueSoon(task.deadlineAt, 3)).length;
    const stat = (key, title, value, icon, tone = "blue", note = "", onClick = null) => ({ key, title, value: typeof value === "number" ? formatKpiNumber(value) : value, icon, tone, note, onClick });
    if (activePage === "users") {
      return [
        stat("users-total", "Total Pengguna", visibleUsers.length, "users", "blue", "Akun terlihat"),
        stat("users-admin", "Admin", visibleUsers.filter((user) => user.role === ROLES.ADMIN).length, "check", "orange", "Akses admin"),
        stat("users-mod", "Moderator", visibleUsers.filter((user) => user.role === ROLES.MODERATOR).length, "users", "green", "Koordinator"),
        stat("users-regular", "User", visibleUsers.filter((user) => user.role === ROLES.USER).length, "users", "yellow", "Pengguna"),
        stat("users-active", "Akun Aktif", visibleUsers.filter((user) => user.status !== "inactive").length, "check", "green", "Aktif")
      ];
    }
    if (activePage === "projects") {
      return [
        stat("projects-total", "Total Project", workingProjects.length, "project", "blue", "Terlihat", () => openSummaryPage("projects", "all")),
        stat("projects-running", "Berjalan", workingProjects.filter((project) => getProjectStatus(project) === "running").length, "clock", "orange", "Aktif", () => openSummaryPage("projects", "running")),
        stat("projects-review", "Dalam Review", workingProjects.filter((project) => project.tasks.some((task) => getTaskReviewState(task).tone === "review")).length, "clock", "yellow", "Validasi", () => openSummaryPage("projects", "review")),
        stat("projects-done", "Selesai", workingProjects.filter((project) => getProjectStatus(project) === "completed").length, "check", "green", "Verified", () => openSummaryPage("projects", "completed")),
        stat("projects-late", "Lewat Deadline", workingProjects.filter((project) => getProjectStatus(project) === "overdue").length, "alert", "red", "Perlu aksi", () => openSummaryPage("projects", "overdue"))
      ];
    }
    if (activePage === "archives") {
      return [
        stat("archives-total", "Total Arsip", archivedProjects.length, "file", "blue", "Project"),
        stat("archives-done", "Selesai", archivedProjects.filter((project) => getProjectStatus(project) === "completed").length, "check", "green", "Verified"),
        stat("archives-tasks", "Task Arsip", archivedProjects.reduce((sum, project) => sum + (project.tasks || []).length, 0), "tasks", "orange", "Tersimpan"),
        stat("archives-size", "Estimasi Size", `${Math.max(0, archivedProjects.length * 8).toFixed(1)} GB`, "file", "purple", "Local demo")
      ];
    }
    if (activePage === "tasks") {
      return [
        stat("tasks-total", "Semua Tugas", tasks.length, "file", "blue", "Terlihat", () => openSummaryPage("tasks", "all")),
        stat("tasks-active", "Aktif", activeTasks, "clock", "orange", "Dikerjakan", () => openSummaryPage("tasks", "active")),
        stat("tasks-done", "Selesai", completedTasks, "check", "green", "Verified", () => openSummaryPage("tasks", "completed")),
        stat("tasks-review", "Perlu Review", reviewTasks, "external", "yellow", "Menunggu", () => openSummaryPage("tasks", "review")),
        stat("tasks-late", "Terlambat", overdueTasks, "alert", "red", "Deadline", () => openSummaryPage("tasks", "overdue"))
      ];
    }
    if (activePage === "deadlines") {
      return [
        stat("deadlines-today", "Deadline Hari Ini", dueToday, "clock", "blue", "Task"),
        stat("deadlines-soon", "3 Hari ke Depan", dueSoon, "clock", "green", "Task dekat"),
        stat("deadlines-late", "Lewat Deadline", overdueTasks, "alert", "red", "Perlu aksi"),
        stat("deadlines-open", "Belum Selesai", tasks.length - completedTasks, "file", "orange", "Task aktif")
      ];
    }
    if (activePage === "notifications") {
      const unread = visibleNotifications.filter((item) => !item.read).length;
      return [
        stat("notif-total", "Semua Notifikasi", visibleNotifications.length, "bell", "blue", "30 hari"),
        stat("notif-unread", "Belum Dibaca", unread, "alert", "orange", "Perlu cek"),
        stat("notif-read", "Sudah Dibaca", visibleNotifications.length - unread, "check", "green", "Selesai"),
        stat("notif-follow", "Deadline Dekat", headerFollowUpTasks.length, "clock", "red", "7 hari")
      ];
    }
    if (activePage === "activity") {
      return [
        stat("activity-total", "Total Log", logs.length, "file", "blue", "Terlihat"),
        stat("activity-valid", "Validasi", logs.filter((log) => getActivityTone(log.action) === "green").length, "check", "green", "Selesai"),
        stat("activity-alert", "Butuh Perhatian", logs.filter((log) => getActivityTone(log.action) === "red").length, "alert", "red", "Risiko"),
        stat("activity-review", "Review/Deadline", logs.filter((log) => getActivityTone(log.action) === "yellow").length, "clock", "yellow", "Menunggu")
      ];
    }
    if (activePage === "profile") {
      const ownedProjects = workingProjects.filter((project) => getProjectOwnerId(project) === currentUser.id).length;
      const assignedTasks = tasks.filter((task) => getTaskAssigneeIds(task).includes(currentUser.id)).length;
      return [
        stat("profile-projects", "Project Saya", ownedProjects, "project", "blue", "Owner"),
        stat("profile-tasks", "Task Saya", assignedTasks, "tasks", "orange", "Ditugaskan"),
        stat("profile-done", "Task Selesai", tasks.filter((task) => getTaskAssigneeIds(task).includes(currentUser.id) && isTaskFullyCompleted(task)).length, "check", "green", "Verified"),
        stat("profile-notif", "Notifikasi", visibleNotifications.filter((item) => !item.read).length, "bell", "purple", "Belum dibaca")
      ];
    }
    return [];
  }, [activePage, selectedProjectId, currentUser, users, projects, archivedProjectIds, activityLogs, visibleNotifications, headerFollowUpTasks]);

  useEffect(() => saveStorage(USERS_KEY, users), [users]);
  useEffect(() => saveStorage(PROJECTS_KEY, sanitizeProjectsForStorage(normalizeProjects(projects))), [projects]);
  useEffect(() => saveStorage(ARCHIVED_PROJECTS_KEY, archivedProjectIds), [archivedProjectIds]);
  useEffect(() => saveStorage(ACTIVITY_LOGS_KEY, activityLogs.slice(0, 120)), [activityLogs]);
  useEffect(() => saveStorage(NOTIFICATIONS_KEY, appNotifications.slice(0, 160)), [appNotifications]);
  useEffect(() => {
    if (currentUser) localStorage.setItem(ACTIVE_USER_KEY, currentUser.id);
  }, [currentUser]);
  useEffect(() => {
    if (currentUser?.role === ROLES.USER && ["users", "archives", "activity"].includes(activePage)) setActivePage("dashboard");
  }, [currentUser, activePage]);
  useEffect(() => {
    if (!selectedProjectId) return;
    const allowed = getVisibleProjects(currentUser, projects, users).some((project) => project.id === selectedProjectId);
    if (!allowed) {
      setSelectedProjectId(null);
      setSelectedTaskId(null);
      setActivePage("dashboard");
    }
  }, [currentUser.id, selectedProjectId, projects, users]);
  useEffect(() => {
    if (!selectedProjectId || !selectedTaskId) return;
    const project = projects.find((item) => item.id === selectedProjectId);
    const task = project?.tasks?.find((item) => item.id === selectedTaskId);
    if (project && task && !canSeeTask(currentUser, task, project, users)) setSelectedTaskId(null);
  }, [currentUser.id, selectedProjectId, selectedTaskId, projects, users]);

  useEffect(() => {
    if (localStorage.getItem("iti_pm_demo_runnable_added") === "1") return;
    const hasRunnable = projects.some((project) => (project.tasks || []).some((task) => !isTaskFullyCompleted(task) && !(task.completionProof?.submissions || []).length && !isPastDeadline(task.deadlineAt)));
    if (!hasRunnable) {
      setProjects((list) => [makeRunnableDemoProject(), ...list]);
      localStorage.setItem("iti_pm_demo_runnable_added", "1");
    }
  }, []);


  function resetDemoData() {
    setUsers(seedUsers);
    const nextProjects = makeDemoProjectDataset();
    setProjects(normalizeProjects(nextProjects));
    setArchivedProjectIds([]);
    setActivityLogs([makeLog("Demo direset", `Dataset demo 1 tahun dimuat ulang: ${nextProjects.length} project dan ${projectTaskCount(nextProjects)} task.`, "u_super")]);
    setAppNotifications([]);
    setActiveUserId("u_super");
    setActivePage("dashboard");
    setSelectedProjectId(null);
    setSelectedTaskId(null);
    localStorage.setItem(DEMO_DATASET_VERSION_KEY, DEMO_DATASET_VERSION);
    showToast("Demo direset", `${nextProjects.length} project dan ${projectTaskCount(nextProjects)} task demo siap dipakai.`);
  }

  function logActivity(action, detail, meta = {}) {
    const log = makeLog(action, detail, currentUser.id, meta);
    setActivityLogs((list) => [log, ...list].slice(0, 120));
    const recipients = Array.from(new Set([...(meta.userIds || []), ...(meta.userId ? [meta.userId] : [])].filter(Boolean)));
    setAppNotifications((list) => [{
      id: makeId("notif"),
      title: action,
      message: detail,
      createdAt: nowIso(),
      read: false,
      createdBy: currentUser.id,
      userId: recipients.length ? null : "all",
      userIds: recipients,
      projectId: meta.projectId || null,
      taskId: meta.taskId || null,
      page: meta.page || null
    }, ...list].slice(0, 160));
  }

  function markNotificationsRead(id = null) {
    const ids = Array.isArray(id) ? id : null;
    setAppNotifications((list) => list.map((item) => {
      if (ids) return ids.includes(item.id) ? { ...item, read: true } : item;
      return id && item.id !== id ? item : ({ ...item, read: true });
    }));
    if (!id || ids) showToast("Notifikasi dibaca", "Notifikasi yang terlihat ditandai dibaca.");
  }

  function openNotification(notification) {
    markNotificationsRead(notification.id);
    if (notification.projectId) return openProject(notification.projectId, notification.taskId || null);
    if (notification.page) { setSelectedProjectId(null); setSelectedTaskId(null); setActivePage(notification.page); return; }
    const hay = `${notification.title || ""} ${notification.message || ""}`.toLowerCase();
    for (const project of projects) {
      const projectHit = hay.includes(String(project.title || "").toLowerCase());
      const task = (project.tasks || []).find((item) => hay.includes(String(item.title || "").toLowerCase()));
      if (task) return openProject(project.id, task.id);
      if (projectHit) return openProject(project.id);
    }
    setActivePage("dashboard");
  }

  function showToast(title, message = "", tone = "success") {
    const toast = { id: makeId("toast"), title, message, tone };
    setToasts((list) => [toast, ...list].slice(0, 4));
    window.setTimeout(() => setToasts((list) => list.filter((item) => item.id !== toast.id)), 3200);
  }

  function dismissToast(id) {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }

  function backupData() {
    const payload = { users, projects: sanitizeProjectsForStorage(projects), activeUserId, archivedProjectIds, activityLogs, appNotifications, exportedAt: nowIso() };
    downloadTextFile(`iti-project-manager-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), "application/json");
    logActivity("Backup data", "File JSON dibuat.");
    showToast("Backup dibuat", "File JSON berhasil diunduh.");
  }

  function restoreData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (!Array.isArray(payload.users) || !Array.isArray(payload.projects)) throw new Error("Invalid backup");
        const totalTasks = payload.projects.reduce((sum, project) => sum + (project.tasks || []).length, 0);
        if (!confirmAction(`Restore akan menimpa data aktif dengan ${payload.users.length} user, ${payload.projects.length} project, dan ${totalTasks} task. Lanjutkan?`)) return;
        const snapshot = { users, projects: sanitizeProjectsForStorage(projects), archivedProjectIds, activityLogs, appNotifications, createdAt: nowIso() };
        localStorage.setItem("iti_pm_restore_snapshot", JSON.stringify(snapshot));
        setUsers(payload.users);
        setProjects(normalizeProjects(payload.projects));
        setArchivedProjectIds(Array.isArray(payload.archivedProjectIds) ? payload.archivedProjectIds : []);
        setActivityLogs(Array.isArray(payload.activityLogs) ? payload.activityLogs : []);
        setAppNotifications(Array.isArray(payload.appNotifications) ? payload.appNotifications : []);
        setActiveUserId(payload.activeUserId || payload.users[0]?.id || "u_super");
        showToast("Restore berhasil", "Data lama disimpan sebagai snapshot localStorage sebelum restore.");
      } catch {
        showToast("Restore gagal", "Format file JSON tidak valid.", "danger");
      }
    };
    reader.readAsText(file);
  }

  function openProject(projectId, taskId = null) {
    setActivePage("projects");
    setSelectedProjectId(projectId);
    setSelectedTaskId(taskId);
  }

  function openSummaryPage(page, filter = "all", options = {}) {
    setSelectedProjectId(null);
    setSelectedTaskId(null);
    const taskFilterMap = { running: "active", completed: "completed", done: "completed", overdue: "overdue", review: "review", active: "active", all: "all" };
    const projectFilterMap = { active: "running", running: "running", completed: "completed", done: "completed", overdue: "overdue", review: "review", all: "all" };
    const taskFilter = taskFilterMap[filter] || filter || "all";
    const projectFilter = projectFilterMap[filter] || filter || "all";
    if (page === "tasks") setTaskPagePreset({ filter: taskFilter || "all", deadline: options.taskDeadline || "all", assignee: options.taskAssignee || "all" });
    if (page === "projects") setProjectPagePreset({ status: options.projectStatus || projectFilter || "all", sort: options.projectSort || "deadline", deadline: options.projectDeadline || "all" });
    const allowedPages = new Set(["dashboard", "users", "projects", "archives", "tasks", "deadlines", "notifications", "activity", "profile"]);
    setActivePage(allowedPages.has(page) ? page : "dashboard");
  }

  if (!currentUser) return null;

  return (
    <div className="theme-shell min-h-screen">
      <main className="app-layout">
        <ItiSidebar activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} onNavigate={() => { setSelectedProjectId(null); setSelectedTaskId(null); }} />
        <div className="app-main">
          <ItiHeader users={users} currentUser={currentUser} setCurrentUserId={(id)=>{ setSelectedProjectId(null); setSelectedTaskId(null); setActiveUserId(id); }} searchQuery={searchQuery} setSearchQuery={setSearchQuery} backupData={backupData} restoreData={restoreData} followUpTasks={headerFollowUpTasks} appNotifications={visibleNotifications} markNotificationsRead={(id) => markNotificationsRead(id ?? visibleNotifications.map((n)=>n.id))} onNotificationClick={openNotification} openProject={openProject} headerKpis={headerKpis} />
          <div className={`iti-content-panel ${headerKpis.length ? "header-kpi-mode" : ""}`}>
            <AppErrorBoundary resetKey={`${activePage}-${selectedProjectId || ""}-${currentUser.id}`} onRecover={() => { setSelectedProjectId(null); setSelectedTaskId(null); setActivePage("dashboard"); }}>
              {selectedProject ? <ItiProjectWorkspace project={selectedProject} currentUser={currentUser} users={users} setProjects={setProjects} close={() => { setSelectedProjectId(null); setSelectedTaskId(null); }} showToast={showToast} logActivity={logActivity} highlightedTaskId={selectedTaskId} /> : <>
                {activePage === "dashboard" && <ItiDashboard currentUser={currentUser} users={users} projects={projects} openProject={openProject} onSummaryOpen={openSummaryPage} searchQuery={searchQuery} activityLogs={activityLogs} archivedProjectIds={archivedProjectIds} />}
                {activePage === "users" && currentUser.role !== ROLES.USER && <ItiUsersPage currentUser={currentUser} users={users} projects={projects} setUsers={setUsers} setProjects={setProjects} searchQuery={searchQuery} showToast={showToast} logActivity={logActivity} />}
                {activePage === "projects" && <ItiProjectsPage currentUser={currentUser} users={users} projects={projects} setProjects={setProjects} openProject={openProject} searchQuery={searchQuery} archivedProjectIds={archivedProjectIds} setArchivedProjectIds={setArchivedProjectIds} showToast={showToast} logActivity={logActivity} initialStatus={projectPagePreset.status} initialSort={projectPagePreset.sort} />}
                {activePage === "archives" && currentUser.role !== ROLES.USER && <ItiArchivePage currentUser={currentUser} users={users} projects={projects} archivedProjectIds={archivedProjectIds} setArchivedProjectIds={setArchivedProjectIds} setProjects={setProjects} openProject={openProject} showToast={showToast} logActivity={logActivity} />}
                {activePage === "tasks" && <ItiTasksPage currentUser={currentUser} users={users} projects={projects} setProjects={setProjects} searchQuery={searchQuery} openProject={openProject} showToast={showToast} logActivity={logActivity} initialStatus={taskPagePreset.filter} />}
                {activePage === "deadlines" && <ItiDeadlinePage currentUser={currentUser} users={users} projects={projects} setProjects={setProjects} searchQuery={searchQuery} openProject={openProject} showToast={showToast} logActivity={logActivity} />}
                {activePage === "notifications" && <ItiNotificationsPage currentUser={currentUser} users={users} notifications={visibleNotifications} setNotifications={setAppNotifications} openNotification={openNotification} searchQuery={searchQuery} />}
                {activePage === "activity" && currentUser.role !== ROLES.USER && <ItiActivityLogPage currentUser={currentUser} users={users} projects={projects} activityLogs={activityLogs} searchQuery={searchQuery} openProject={openProject} />}
                {activePage === "profile" && <ItiProfilePage currentUser={currentUser} setUsers={setUsers} showToast={showToast} logActivity={logActivity} />}
              </>}
            </AppErrorBoundary>
          </div>
        </div>
      </main>
      {false && selectedProject && <ProjectDetailModal project={selectedProject} currentUser={currentUser} users={users} setProjects={setProjects} close={() => setSelectedProjectId(null)} logActivity={logActivity} />}
      <ItiMobileBottomNav activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} unreadCount={visibleNotifications.filter((n)=>!n.read).length} onNavigate={() => { setSelectedProjectId(null); setSelectedTaskId(null); }} />
      <ToastStack toasts={toasts} dismissToast={dismissToast} />
    </div>
  );
}
