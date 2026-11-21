const STORAGE_KEY = "contacthub_contacts";

const addBtn = document.getElementById("addContactBtn");
const form = document.getElementById("contactForm");
const modalEl = document.getElementById("contactModal");
const modal = new bootstrap.Modal(modalEl);
const modalTitle = document.getElementById("modalTitle");
const searchInput = document.getElementById("searchInput");
const listEl = document.getElementById("contactsList");
const favListEl = document.getElementById("favList");
const emgListEl = document.getElementById("emgList");
const emptyState = document.getElementById("emptyState");

const avatarPreview = document.getElementById("avatarPreview");
const avatarInitials = document.getElementById("avatarInitials");
const photoInput = document.getElementById("photoInput");
const changePhotoBtn = document.getElementById("changePhotoBtn");
const removePhotoBtn = document.getElementById("removePhotoBtn");
const photoError = document.getElementById("photoError");

const fields = {
  name: document.getElementById("name"),
  phone: document.getElementById("phone"),
  email: document.getElementById("email"),
  address: document.getElementById("address"),
  group: document.getElementById("group"),
  notes: document.getElementById("notes"),
  isFav: document.getElementById("isFav"),
  isEmg: document.getElementById("isEmg"),
};

let contacts = loadContacts();
let editingId = null;
let currentPhoto = "";

function loadContacts() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function saveContacts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    return true;
  } catch {
    Swal.fire({
      icon: "error",
      title: "Storage full",
      text: "Could not save. Try removing some photos.",
    });
    return false;
  }
}

const GRADIENTS = [
  "linear-gradient(135deg,#ff2e7e,#e11d48)",
  "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  "linear-gradient(135deg,#10b981,#047857)",
  "linear-gradient(135deg,#f59e0b,#ea580c)",
  "linear-gradient(135deg,#8b5cf6,#6d28d9)",
  "linear-gradient(135deg,#06b6d4,#0e7490)",
];
const DEFAULT_GRADIENT = "linear-gradient(135deg,#3b82f6,#1d4ed8)";

function gradientFor(c) {
  let sum = 0;
  for (const ch of c.name) sum += ch.charCodeAt(0);
  return GRADIENTS[sum % GRADIENTS.length];
}
function avatarStyle(c) {
  return c.photo
    ? `background:center/cover no-repeat url('${c.photo}')`
    : `background:${gradientFor(c)}`;
}
function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}
function esc(str = "") {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
function toast(icon, title) {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
  });
}

function updateAvatarPreview() {
  const name = fields.name.value.trim();
  if (currentPhoto) {
    avatarPreview.style.background = `center/cover no-repeat url("${currentPhoto}")`;
    avatarInitials.innerHTML = "";
  } else if (name) {
    avatarPreview.style.background = gradientFor({ name });
    avatarInitials.textContent = initials(name);
  } else {
    avatarPreview.style.background = DEFAULT_GRADIENT;
    avatarInitials.innerHTML = '<i class="fa-solid fa-user"></i>';
  }
  removePhotoBtn.classList.toggle("d-none", !currentPhoto);
}

function showPhotoError(msg) {
  photoError.textContent = msg;
  photoError.classList.toggle("d-none", !msg);
}

changePhotoBtn.addEventListener("click", () => photoInput.click());

removePhotoBtn.addEventListener("click", () => {
  currentPhoto = "";
  showPhotoError("");
  updateAvatarPreview();
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  photoInput.value = "";
  if (!file) return;

  if (!file.type.startsWith("image/"))
    return showPhotoError("Please choose an image file.");
  if (file.size > 5 * 1024 * 1024)
    return showPhotoError("Image is too large (max 5MB).");
  showPhotoError("");

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const size = 240;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      canvas
        .getContext("2d")
        .drawImage(img, sx, sy, side, side, 0, 0, size, size);
      currentPhoto = canvas.toDataURL("image/jpeg", 0.85);
      updateAvatarPreview();
    };
    img.onerror = () => showPhotoError("Could not read this image.");
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const NAME_RE = /^[\p{L}][\p{L}\s.'-]{1,39}$/u;
const PHONE_RE = /^01[0125][0-9]{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setValidity(input, ok) {
  input.classList.toggle("is-invalid", !ok);
  input.classList.toggle("is-valid", ok && input.value.trim() !== "");
  return ok;
}

function validateName() {
  return setValidity(fields.name, NAME_RE.test(fields.name.value.trim()));
}
function validatePhone() {
  const value = fields.phone.value.trim();
  let ok = PHONE_RE.test(value);
  const feedback = document.getElementById("phoneFeedback");
  if (ok) {
    const duplicate = contacts.some(
      (c) => c.phone === value && c.id !== editingId,
    );
    if (duplicate) {
      ok = false;
      feedback.textContent =
        "This phone number already exists in your contacts.";
    }
  } else {
    feedback.textContent = "Enter a valid Egyptian number (e.g., 01012345678).";
  }
  return setValidity(fields.phone, ok);
}
function validateEmail() {
  const value = fields.email.value.trim();
  return setValidity(fields.email, value === "" || EMAIL_RE.test(value));
}

fields.name.addEventListener("input", () => {
  validateName();
  updateAvatarPreview();
});
fields.phone.addEventListener("input", validatePhone);
fields.email.addEventListener("input", validateEmail);

function resetForm() {
  form.reset();
  Object.values(fields).forEach((f) =>
    f.classList.remove("is-invalid", "is-valid"),
  );
  editingId = null;
  currentPhoto = "";
  showPhotoError("");
  updateAvatarPreview();
}

addBtn.addEventListener("click", () => {
  resetForm();
  modalTitle.textContent = "Add New Contact";
  modal.show();
});

modalEl.addEventListener("hidden.bs.modal", resetForm);

function openEdit(id) {
  const c = contacts.find((x) => x.id === id);
  if (!c) return;
  resetForm();
  editingId = id;
  modalTitle.textContent = "Edit Contact";
  fields.name.value = c.name;
  fields.phone.value = c.phone;
  fields.email.value = c.email;
  fields.address.value = c.address;
  fields.group.value = c.group;
  fields.notes.value = c.notes;
  fields.isFav.checked = c.favorite;
  fields.isEmg.checked = c.emergency;
  currentPhoto = c.photo || "";
  updateAvatarPreview();
  modal.show();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const valid = [validateName(), validatePhone(), validateEmail()].every(
    Boolean,
  );
  if (!valid) return;

  const data = {
    name: fields.name.value.trim(),
    phone: fields.phone.value.trim(),
    email: fields.email.value.trim(),
    address: fields.address.value.trim(),
    group: fields.group.value,
    notes: fields.notes.value.trim(),
    favorite: fields.isFav.checked,
    emergency: fields.isEmg.checked,
    photo: currentPhoto,
  };

  const previous = contacts;
  if (editingId) {
    contacts = contacts.map((c) =>
      c.id === editingId ? { ...c, ...data } : c,
    );
  } else {
    contacts = [{ id: Date.now().toString(), ...data }, ...contacts];
  }

  if (!saveContacts()) {
    contacts = previous; 
    return;
  }

  const wasEditing = !!editingId;
  modal.hide();
  render();
  Swal.fire({
    icon: "success",
    title: wasEditing ? "Updated!" : "Added!",
    text: wasEditing
      ? "Contact updated successfully."
      : "Contact added successfully.",
    timer: 1800,
    showConfirmButton: false,
  });
});

function deleteContact(id) {
  const c = contacts.find((x) => x.id === id);
  if (!c) return;
  Swal.fire({
    title: "Are you sure?",
    text: `Do you really want to delete ${c.name}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e11d48",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it!",
  }).then((res) => {
    if (res.isConfirmed) {
      contacts = contacts.filter((x) => x.id !== id);
      saveContacts();
      render();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Contact has been deleted.",
        timer: 1600,
        showConfirmButton: false,
      });
    }
  });
}

function toggle(id, key) {
  const c = contacts.find((x) => x.id === id);
  if (!c) return;
  c[key] = !c[key];
  saveContacts();
  render();
  const label = key === "favorite" ? "favorites" : "emergency contacts";
  toast("success", c[key] ? `Added to ${label}` : `Removed from ${label}`);
}

function contactCard(c) {
  const mail = c.email
    ? `<a class="act mail" href="mailto:${esc(c.email)}" title="Send email"><i class="fa-solid fa-envelope"></i></a>`
    : `<span class="act mail disabled"><i class="fa-solid fa-envelope"></i></span>`;
  return `
  <div class="col-12 col-xl-6">
    <div class="contact-card">
      <div class="card-top">
        <div class="d-flex gap-3 align-items-start">
          <div class="avatar" style="${avatarStyle(c)}">
            ${c.photo ? "" : esc(initials(c.name))}
            ${c.favorite ? '<span class="badge-dot fav"><i class="fa-solid fa-star"></i></span>' : ""}
            ${c.emergency ? '<span class="badge-dot emg"><i class="fa-solid fa-heart-pulse"></i></span>' : ""}
          </div>
          <div class="flex-grow-1">
            <h5 class="contact-name">${esc(c.name)}</h5>
            <div class="info-row"><span class="info-ico ico-phone"><i class="fa-solid fa-phone"></i></span>${esc(c.phone)}</div>
          </div>
        </div>
        ${c.email ? `<div class="info-row"><span class="info-ico ico-mail"><i class="fa-solid fa-envelope"></i></span>${esc(c.email)}</div>` : ""}
        ${c.address ? `<div class="info-row"><span class="info-ico ico-pin"><i class="fa-solid fa-location-dot"></i></span>${esc(c.address)}</div>` : ""}
        <div class="d-flex flex-wrap gap-2 mt-3">
          ${c.group ? `<span class="tag tag-${esc(c.group)}">${esc(c.group)}</span>` : ""}
          ${c.emergency ? '<span class="tag tag-emg"><i class="fa-solid fa-heart-pulse me-1"></i>Emergency</span>' : ""}
        </div>
      </div>
      <div class="card-actions">
        <a class="act call" href="tel:${esc(c.phone)}" title="Call"><i class="fa-solid fa-phone"></i></a>
        ${mail}
        <div class="ms-auto d-flex gap-2">
          <button class="act fav ${c.favorite ? "on" : ""}" data-action="fav" data-id="${c.id}" title="Favorite">
            <i class="${c.favorite ? "fa-solid" : "fa-regular"} fa-star"></i>
          </button>
          <button class="act emg ${c.emergency ? "on" : ""}" data-action="emg" data-id="${c.id}" title="Emergency">
            <i class="fa-solid fa-heart-pulse"></i>
          </button>
          <button class="act edit" data-action="edit" data-id="${c.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="act del" data-action="del" data-id="${c.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>
  </div>`;
}

function sideItem(c) {
  return `
  <div class="side-item">
    <div class="avatar sm" style="${avatarStyle(c)}">${c.photo ? "" : esc(initials(c.name))}</div>
    <div class="meta"><strong>${esc(c.name)}</strong><span>${esc(c.phone)}</span></div>
    <a class="side-call" href="tel:${esc(c.phone)}" title="Call"><i class="fa-solid fa-phone"></i></a>
  </div>`;
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q),
  );

  listEl.innerHTML = filtered.map(contactCard).join("");

  emptyState.classList.toggle("d-none", filtered.length > 0);
  if (filtered.length === 0) {
    document.getElementById("emptyText").textContent = q
      ? "Try a different name, phone, or email"
      : 'Click "Add Contact" to get started';
  }

  const favs = contacts.filter((c) => c.favorite);
  const emgs = contacts.filter((c) => c.emergency);
  favListEl.innerHTML = favs.length
    ? favs.map(sideItem).join("")
    : '<div class="side-empty">No favorites yet</div>';
  emgListEl.innerHTML = emgs.length
    ? emgs.map(sideItem).join("")
    : '<div class="side-empty">No emergency contacts</div>';

  document.getElementById("totalCount").textContent = contacts.length;
  document.getElementById("subCount").textContent = contacts.length;
  document.getElementById("favCount").textContent = favs.length;
  document.getElementById("emgCount").textContent = emgs.length;
}

searchInput.addEventListener("input", render);

listEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === "fav") toggle(id, "favorite");
  else if (action === "emg") toggle(id, "emergency");
  else if (action === "edit") openEdit(id);
  else if (action === "del") deleteContact(id);
});

updateAvatarPreview();
render();
