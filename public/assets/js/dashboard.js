(function($) {
  'use strict';
  $(function() {
    let chartInstance; // Store the chart instance for updates later

    // Function to fetch chart data and update the chart
    const fetchChartData = (sortBy) => {
      $.ajax({
        url: `/admin/chart-data?chart=${sortBy}`,
        method: 'GET',
        success: function(response) {
          const ctx = document.getElementById('performanceLine').getContext('2d');
          let labels = [];
          let dataPoints = [];

          // Adjust labels and initialize data points based on sorting type (week, month, year)
          if (sortBy === "year") {
            labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            dataPoints = new Array(12).fill(0);
          } else if (sortBy === "month") {
            const daysInMonth = moment().daysInMonth();
            labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            dataPoints = new Array(daysInMonth).fill(0);
          } else {
            labels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            dataPoints = new Array(7).fill(0);
          }

          // Populate data points from response
          response.data.forEach(dayData => {
            dataPoints[dayData._id - 1] = dayData.totalOrders;
          });

          // Define gradient for background
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(66, 135, 245, 0.5)');
          gradient.addColorStop(1, 'rgba(66, 135, 245, 0)');

          // If chartInstance exists, destroy it before creating a new one to avoid overlap
          if (chartInstance) {
            chartInstance.destroy();
          }

          // Create the chart with modern design
          chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                label: 'Performance',
                data: dataPoints,
                backgroundColor: gradient,
                borderColor: '#4287f5',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#4287f5',
                pointHoverRadius: 6,
                fill: true,
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  backgroundColor: '#4287f5',
                  titleFont: {
                    size: 14,
                    family: 'Helvetica, Arial, sans-serif',
                  },
                  bodyFont: {
                    size: 12,
                    family: 'Helvetica, Arial, sans-serif',
                  },
                  callbacks: {
                    label: function(tooltipItem) {
                      return ` Orders: ${tooltipItem.raw}`;
                    }
                  },
                  padding: 10,
                  cornerRadius: 6,
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: '#6B778C',
                    font: {
                      size: 12,
                      family: 'Helvetica, Arial, sans-serif',
                    }
                  },
                  grid: {
                    color: '#eaeaea'
                  }
                },
                x: {
                  ticks: {
                    color: '#6B778C',
                    font: {
                      size: 12,
                      family: 'Helvetica, Arial, sans-serif',
                    }
                  },
                  grid: {
                    display: false,
                  }
                }
              }
            }
          });
        },
        error: function(err) {
          console.error('Error fetching chart data', err);
        }
      });
    };

    // Fetch initial data for the week
    fetchChartData('week');

    // Update chart when dropdown is clicked
    $(document).ready(function () {
      $('.chart-sort').on('click', function () {
        const sortBy = $(this).data('sort');
        fetchChartData(sortBy); // Function for fetching the chart data
      });
    }); 
  });
})(jQuery);
