document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle.querySelector('.mdi');

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
      themeIcon.className = 'mdi mdi-weather-sunny text-xl';
      // Light mode: gradient reversed (left: black, right: gray)
      document.documentElement.style.setProperty('--primary', '#000000');
      document.documentElement.style.setProperty('--secondary', '#808080');
      document.body.style.backgroundColor = '#f0f4ff';
      document.body.style.color = '#000000';
    } else {
      document.documentElement.classList.remove('light-mode');
      themeIcon.className = 'mdi mdi-weather-night text-xl';
      // Dark mode: gradient (left: gray, right: black)
      document.documentElement.style.setProperty('--primary', '#808080');
      document.documentElement.style.setProperty('--secondary', '#000000');
      document.body.style.backgroundColor = '#0a0f1d';
      document.body.style.color = '#ffffff';
    }
    localStorage.setItem('theme', theme);
  }

  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  });

  // Helper: Returns trend badge HTML based on trend value(s)
  const getTrendBadge = (trend) => {
    const getBadge = (t) => {
      const lowerTrend = t.toLowerCase();
      if (lowerTrend === 'rare') {
        return `<span class="mdi mdi-diamond-stone text-blue-400 text-2xl"></span>`;
      } else if (lowerTrend === 'hoarded' || lowerTrend === 'hoard') {
        return `<span class="mdi mdi-package-variant-closed text-orange-400 text-2xl"></span>`;
      } else if (lowerTrend === 'increasing') {
        return `<span class="mdi mdi-arrow-up-bold text-green-500 text-2xl"></span>`;
      } else if (lowerTrend === 'decreasing') {
        return `<span class="mdi mdi-arrow-down-bold text-red-500 text-2xl"></span>`;
      } else if (lowerTrend === 'projected') {
        return `<span class="mdi mdi-alert text-yellow-500 text-2xl"></span>`;
      } else {
        return '';
      }
    };

    return Array.isArray(trend) ? trend.map(t => getBadge(t)).join(' ') : getBadge(trend);
  };

  // Load items and display them
  const loadItems = async () => {
    try {
      const items = await (await fetch('/api/items')).json();
      window.itemsData = items;
      const container = document.getElementById('itemsContainer');

      container.innerHTML = items.map((item, i) => {
        const formattedTime = new Date(item.timestamp).toLocaleString('en-US', {
          weekday: 'long',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
        return `
          <div class="glass-card p-6 transform transition hover:scale-[1.02] relative item-card" data-index="${i}">
            <div class="absolute top-0 left-0 m-2">
              ${getTrendBadge(item.trend)}
            </div>
            <div>
              <img src="${item.image}" class="w-full h-48 object-contain mb-4" alt="${item.name}">
            </div>
            <h3 class="text-xl font-bold mb-2 flex items-center">
              <span class="mdi mdi-sword-cross mr-2 text-primary"></span>
              ${item.name}
            </h3>
            <div class="flex justify-between items-center text-sm">
              <div class="flex items-center relative value-container">
                <span class="mdi mdi-cash-multiple mr-1"></span>
                <span class="value-text">${item.value}</span>
                <div class="tooltip hidden">
                  ${formattedTime}
                </div>
              </div>
              <div class="flex items-center">
                <span class="mdi mdi-chart-bar mr-1"></span>
                ${item.demand}
              </div>
            </div>
            <!-- Graph button -->
            <button class="graph-btn absolute top-2 right-2 z-30 bg-white bg-opacity-80 rounded-full p-1 hover:bg-opacity-100">
              <span class="mdi mdi-chart-line text-xl"></span>
            </button>
            <!-- Hidden chart container to display graph -->
            <div class="chart-container hidden">
              <canvas id="chart-${i}"></canvas>
            </div>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.value-container').forEach(container => {
        const tooltip = container.querySelector('.tooltip');
        container.addEventListener('mouseenter', () => {
          tooltip.classList.remove('hidden');
        });
        container.addEventListener('mouseleave', () => {
          tooltip.classList.add('hidden');
        });
      });

      // Attach click event to graph buttons to toggle graph display
      document.querySelectorAll('.graph-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          const card = this.closest('.item-card');
          const chartContainer = card.querySelector('.chart-container');
          if (chartContainer.classList.contains('hidden')) {
            chartContainer.classList.remove('hidden');
            if (!card.dataset.chartCreated) {
              const index = card.getAttribute('data-index');
              const item = window.itemsData[index];
              let labels = [];
              let dataPoints = [];
              if (item.history && item.history.length > 0) {
                // Use the oldValue of the first update as the initial point.
                labels.push(new Date(item.history[0].timestamp).toLocaleTimeString());
                dataPoints.push(Number(item.history[0].oldValue));
                item.history.forEach(event => {
                  labels.push(new Date(event.timestamp).toLocaleTimeString());
                  dataPoints.push(Number(event.newValue));
                });
              }
              // Always add the current value as the latest data point.
              labels.push(new Date(item.timestamp).toLocaleTimeString());
              dataPoints.push(Number(item.value));
              const ctx = document.getElementById(`chart-${index}`).getContext('2d');
              new Chart(ctx, {
                type: 'line',
                data: {
                  labels: labels,
                  datasets: [{
                    label: 'Value',
                    data: dataPoints,
                    borderColor: 'rgba(75,192,192,1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.3
                  }]
                },
                options: {
                  animation: { duration: 1000, easing: 'easeInOutQuad' },
                  scales: {
                    x: { title: { display: true, text: 'Time' } },
                    y: { title: { display: true, text: 'Value' } }
                  },
                  plugins: { legend: { display: false } }
                },
                plugins: [{
                  beforeDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 3;
                    ctx.shadowOffsetY = 3;
                  },
                  afterDraw: (chart) => {
                    chart.ctx.restore();
                  }
                }]
              });
              card.dataset.chartCreated = "true";
            }
          } else {
            chartContainer.classList.add('hidden');
          }
        });
      });
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  // Load games (unchanged)
  const loadGames = async () => {
    try {
      const games = await (await fetch('/api/games')).json();
      const popularGamesContainer = document.getElementById('popularGames');
      const favoritedGamesContainer = document.getElementById('favoritedGames');

      const popularGames = games.filter(game => game.category === 'popular');
      const favoritedGames = games.filter(game => game.category === 'favorited');

      if (popularGames.length) {
        popularGames.forEach(game => {
          popularGamesContainer.innerHTML += `
            <div class="flex items-center gap-4">
              <img src="${game.image || 'https://via.placeholder.com/80'}" alt="Game" class="w-20 h-20 object-cover rounded">
              <div>
                <div class="text-lg font-bold">${game.gamename || 'Game Name'}</div>
                <div class="text-sm text-gray-400">by: ${game.username || 'username'}</div>
              </div>
            </div>
          `;
        });
      }

      if (favoritedGames.length) {
        favoritedGames.forEach(game => {
          favoritedGamesContainer.innerHTML += `
            <div class="flex items-center gap-4">
              <img src="${game.image || 'https://via.placeholder.com/80'}" alt="Game" class="w-20 h-20 object-cover rounded">
              <div>
                <div class="text-lg font-bold">${game.gamename || 'Game Name'}</div>
                <div class="text-sm text-gray-400">by: ${game.username || 'username'}</div>
              </div>
            </div>
          `;
        });
      }
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

  // Animate count-up for Items Tracked and Active Traders
  function animateCount(id, target, duration, suffix) {
    const element = document.getElementById(id);
    let start = 0;
    const stepTime = 50;
    const steps = duration / stepTime;
    const increment = target / steps;
    const interval = setInterval(() => {
      start += increment;
      if (start >= target) {
        element.textContent = target + suffix;
        clearInterval(interval);
      } else {
        element.textContent = Math.floor(start);
      }
    }, stepTime);
  }

  animateCount("trackedCount", 200, 2000, "k+");
  animateCount("tradersCount", 2, 2000, "K+");

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  });

  loadItems();
  loadGames();

  // Special thanks hover effect
  document.querySelectorAll('.special-thanks li').forEach(item => {
    item.addEventListener('mouseenter', function() {
      this.style.transform = 'translateX(10px)';
      const mdi = this.querySelector('.mdi');
      if (mdi) {
        mdi.style.color = 'var(--primary)';
      }
    });
    item.addEventListener('mouseleave', function() {
      this.style.transform = 'translateX(0)';
      const mdi = this.querySelector('.mdi');
      if (mdi) {
        mdi.style.color = '';
      }
    });
  });
});
