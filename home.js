console.log('home.js loaded');
const user = JSON.parse(localStorage.getItem('user'));
console.log('Home page user object:', user, 'userId:', user && user.id);

// تأكد من وجود التوكن وإعادة التوجيه للـ login إذا لم يكن موجودًا
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

// دالة لتحميل الجمعيات التي انضممت إليها فقط
async function loadMyAssociations() {
  try {
    const res = await fetch(
      "https://money-production-bfc6.up.railway.app/api/associations/my-associations",
      {
        headers: { Authorization: "Bearer " + token },
      }
    );
    const json = await res.json();
    if (!res.ok)
      throw new Error(json.message || json.error || "Error fetching data");

    const listEl = document.getElementById("circle-list");
    listEl.innerHTML = "";

    if (!json.data || json.data.length === 0) {
      listEl.innerHTML =
        '<p class="text-center text-muted"> You have not joined any associations yet.</p>';
      return;
    }

    json.data.forEach((a) => {
      const join = new Date(a.joinDate);
      const start = join.toLocaleDateString("en-EG", { year: "numeric", month: "long" });
      const endDate = new Date(join);
      endDate.setMonth(endDate.getMonth() + a.duration);
      const end = endDate.toLocaleDateString("en-EG", { year: "numeric", month: "long" });
      const pct = Math.max(
        0,
        Math.min(
          100,
          Math.round(((new Date() - join) / (endDate - join)) * 100)
        )
      );

      const card = document.createElement("div");
      card.className = "mx-2 bg-white border rounded-2xl shadow p-4 text-right font-sans mb-4 cursor-pointer";
      card.setAttribute('data-association-id', a.id);

      card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <p class="text-green-600 text-2xl font-medium">${a.name}</p>
          <div class="text-2xl font-bold text-gray-800">${a.monthlyAmount.toLocaleString("en-EG")} SAR</div>
        </div>

        <div class="text-blue-600 text-sm mb-4">
          ${a.monthlyAmount.toLocaleString("en-EG")} SAR monthly
        </div>

        <div class="bg-gray-100 rounded-xl p-3 mb-4">
          <div class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <div class="bg-blue-100 text-blue-600 rounded-full p-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 10a3 3 0 100-6 3 3 0 000 6zM2 17a6 6 0 0112 0H2z"/>
              </svg>
            </div>
            Role (${a.status} | ${a.duration} months)
          </div>
          <div class="flex items-center justify-between text-sm text-gray-600">
            <span>${start}</span>
            <span class="font-bold text-gray-800">${a.duration} months</span>
            <span>${end}</span>
          </div>
          <div class="w-full bg-gray-300 h-1 rounded mt-2 mb-1">
            <div class="bg-black h-1 rounded" style="width: ${pct}%;"></div>
          </div>
        </div>

        <div class="flex items-center justify-between text-green-600 text-sm font-medium">
          <div class="flex items-center gap-1">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927C9.469 1.891 10.53 1.891 10.95 2.927l1.286 3.262 3.516.272c1.074.083 1.51 1.396.729 2.14l-2.624 2.418.783 3.447c.24 1.06-.84 1.916-1.79 1.387L10 13.187l-3.4 2.666c-.95.528-2.03-.327-1.79-1.387l.783-3.447-2.624-2.418c-.78-.744-.345-2.057.729-2.14l3.516-.272 1.286-3.262z"/>
            </svg>
            Installment Discount
          </div>
          <span>${(a.discountAmount || 0).toLocaleString("en-EG")} SAR</span>
        </div>

        <div class="text-sm text-gray-500 text-center mt-2">No fees</div>
      `;
      listEl.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    console.log("❌ " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", loadMyAssociations);
