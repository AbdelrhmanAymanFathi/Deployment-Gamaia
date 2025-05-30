    // 1. Require login via token in localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to view this page.');
      window.location.href = '/login.html';
    }

    // Dropdown profile menu
    $('#profile-toggle').on('click', () => {
      $('#popup-menu').toggleClass('opacity-100 pointer-events-auto')
                      .toggleClass('opacity-0 pointer-events-none');
    });
    $('#logout-btn').on('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    });

    // Helper to move card to joined section
    function moveToJoined($card) {
      $('#joinedSection').removeClass('hidden');
      $card.find('.join-button')
           .removeClass('text-blue-600 hover:underline')
           .addClass('text-gray-400 cursor-not-allowed')
           .prop('disabled', true)
           .text('Joined');
      $('#joinedContainer').append($card);
    }

    // Fetch suggestions
    $('.btn-next').on('click', function() {
      const amount = parseFloat($('.input-amount').val());
      if (!amount || amount < 1) {
        return alert('Please enter a valid amount (minimum 1).');
      }
      const $container = $('#suggestionsContainer');
      $container.empty();

      $.ajax({
        type: 'POST',
        url: 'http://localhost:3000/api/payments/pay/suggest',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + token },
        data: JSON.stringify({ amount }),
        success: function(res) {
          const suggestions = res.suggestions || [];
          if (!res.success || suggestions.length === 0) {
            return $container.html(
              '<p class="col-span-full text-center text-gray-500">No suggestions found.</p>'
            );
          }
          suggestions.forEach(assoc => {
            // Dates & progress percent
            const join = new Date(assoc.joinDate);
            const start = join.toLocaleDateString("en-EG", { year:"numeric", month:"long" });
            const endDate = new Date(join);
            endDate.setMonth(endDate.getMonth() + assoc.duration);
            const end = endDate.toLocaleDateString("en-EG", { year:"numeric", month:"long" });
            const pct = Math.max(0, Math.min(100,
              Math.round((new Date() - join) / (endDate - join) * 100)
            ));

            // Build card
            const $card = $(`
              <div class="card max-w-md  bg-white border rounded-2xl shadow p-4 text-right font-sans" id="card" data-id="${assoc.id}">
                <div class="flex items-center justify-between mb-2">
                  <button class="join-button text-blue-600 font-medium hover:underline" data-id="${assoc.id}">
                    Join
                  </button>
                  <div class="text-2xl font-bold text-gray-800">
                    ${assoc.name}
                  </div>
                </div>
                <h5 class="text-lg font-medium text-gray-900 mb-2">${assoc.monthlyAmount.toLocaleString("en-EG")} EGP</h5>
                <div class="text-blue-600 text-sm mb-4">
                  ${assoc.monthlyAmount.toLocaleString("en-EG")} EGP monthly
                </div>
                <div class="bg-gray-100 rounded-xl p-3 mb-4">
                  <div class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <div class="bg-blue-100 text-blue-600 rounded-full p-1">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 10a3 3 0 100-6 3 3 0 000 6zM2 17a6 6 0 0112 0H2z"/>
                      </svg>
                    </div>
                    Role (${assoc.type})
                  </div>
                  <div class="flex items-center justify-between text-sm text-gray-600">
                    <span>${start}</span>
                    <span class="font-bold text-gray-800">${assoc.duration} months</span>
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
                  <span>${(assoc.discountAmount || 0).toLocaleString("en-EG")} EGP</span>
                </div>
                <div class="text-sm text-gray-500 text-center mt-2">No fees</div>
              </div>
            `);
            $container.append($card);
          });
        },
        error: function(err) {
          console.error('Error fetching suggestions:', err);
          alert('Error fetching suggestions.');
        }
      });
    });

    // Join handler
    $(document).on('click', '.join-button', function() {
      const $btn = $(this);
      const assocId = $btn.data('id');
      const $card = $btn.closest('[data-id]');
      $btn.prop('disabled', true).text('Joining...');

      $.ajax({
        type: 'POST',
        url: `http://localhost:3000/api/associations/${assocId}/join`,
        headers: { Authorization: 'Bearer ' + token },
        success: function(res) {
          if (res.success) {
            alert('Successfully joined!');
            moveToJoined($card);
          } else {
            alert(res.error || 'Join failed');
            $btn.prop('disabled', false).text('Join');
          }
        },
        error: function(err) {
          console.error('Join error:', err);
          alert(err.responseJSON?.error || 'Error joining.');
          $btn.prop('disabled', false).text('Join');
        }
      });
    });

    // Load joined associations on page load
    function loadJoinedAssociations() {
      if (!token) {
        console.log('No token found, skipping joined associations load');
        return;
      }

      $.ajax({
        type: 'GET',
        url: 'http://localhost:3000/api/associations/joined',
        headers: { Authorization: 'Bearer ' + token },
        success: function(res) {
          if (!res.success) {
            console.log('No joined associations found');
            return;
          }
          
          const associations = res.associations || [];
          if (associations.length > 0) {
            $('#joinedSection').removeClass('hidden');
          }
          associations.forEach(assoc => {
            const join = new Date(assoc.joinDate);
            const start = join.toLocaleDateString("en-EG", { year:"numeric", month:"long" });
            const endDate = new Date(join);
            endDate.setMonth(endDate.getMonth() + assoc.duration);
            const end = endDate.toLocaleDateString("en-EG", { year:"numeric", month:"long" });
            const pct = Math.max(0, Math.min(100,
              Math.round((new Date() - join) / (endDate - join) * 100)
            ));

            const $card = $(`
              <div class="card max-w-md  bg-white border rounded-2xl shadow p-4 text-right font-sans" id="card">
                <h5 class="text-lg font-medium text-gray-900 mb-2">${assoc.name}</h5>
                <div class="flex items-center justify-between mb-2">
                  <div class="text-2xl font-bold text-gray-800">
                    ${assoc.monthlyAmount.toLocaleString("en-EG")} EGP
                  </div>
                </div>
                <div class="text-blue-600 text-sm mb-4">
                  ${assoc.monthlyAmount.toLocaleString("en-EG")} EGP monthly
                </div>
                <div class="bg-gray-100 rounded-xl p-3 mb-4">
                  <div class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <div class="bg-blue-100 text-blue-600 rounded-full p-1">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 10a3 3 0 100-6 3 3 0 000 6zM2 17a6 6 0 0112 0H2z"/>
                      </svg>
                    </div>
                    Role (${assoc.type})
                  </div>
                  <div class="flex items-center justify-between text-sm text-gray-600">
                    <span>${start}</span>
                    <span class="font-bold text-gray-800">${assoc.duration} months</span>
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
                  <span>${(assoc.discountAmount || 0).toLocaleString("en-EG")} EGP</span>
                </div>
                <div class="text-sm text-gray-500 text-center mt-2">No fees</div>
              </div>
            `);
            $('#joinedContainer').append($card);
          });
        },
        error: function(err) {
          console.log('Error loading joined associations:', err);
          // Don't show error to user since this is not critical
        }
      });
    }

    // Call loadJoinedAssociations when document is ready
    $(document).ready(function() {
      loadJoinedAssociations();
    });

    document.addEventListener("DOMContentLoaded", function() {
        const btn = document.getElementById("joinNowBtn");
        if (btn) {
            btn.onclick = function(event) {
                event.preventDefault();
                // You can pass parameters via query string if you need to
                window.location.href = "select_turn.html";
            }
        }
    });