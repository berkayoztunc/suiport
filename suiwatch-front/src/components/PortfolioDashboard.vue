<template>
  <div>
    <!-- Wallet Address Section -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          TD
        </div>
        <span class="text-white text-lg font-medium">Ttd7...pn6u</span>
        <button class="text-gray-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </button>
        <button class="text-gray-400 hover:text-yellow-400 transition-colors">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
          </svg>
        </button>
      </div>
      <div class="flex items-center space-x-3">
        <button class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
        <button class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 p-6">
      
      <!-- Left Column (2/5 width) - Net Worth and Holdings -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Net Worth Section -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-gray-400 text-base font-medium">Net Worth</h2>
            <div class="flex items-center space-x-3">
              <button class="text-gray-400 hover:text-white transition-colors p-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
              <button class="text-gray-400 hover:text-white transition-colors p-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="mb-8">
            <div class="text-5xl font-bold text-white mb-2">$1,492.78</div>
            <div class="text-gray-400 text-lg">7.75 SOL</div>
          </div>
        </div>

        <!-- Holdings Cards Grid -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Holdings PnL -->
          <div class="group cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-400 text-sm font-medium">Holdings PnL</span>
              <svg class="w-4 h-4 text-gray-500 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-green-400 text-2xl font-bold">+$100.13</span>
              <span class="bg-green-500 text-black text-xs px-2 py-0.5 rounded-full font-semibold">New</span>
            </div>
          </div>

          <!-- Claimable -->
          <div class="group cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-400 text-sm font-medium">Claimable</span>
              <svg class="w-4 h-4 text-gray-500 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
            <div class="text-white text-2xl font-bold">$13.76</div>
          </div>

          <!-- JUP Holdings -->
          <div>
            <div class="flex items-center space-x-2 mb-2">
              <div class="w-4 h-4 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full"></div>
              <span class="text-gray-400 text-sm font-medium">JUP Holdings</span>
            </div>
            <div class="text-white text-2xl font-bold">2.87K</div>
          </div>

          <!-- JUP Staked -->
          <div>
            <div class="flex items-center space-x-2 mb-2">
              <div class="w-4 h-4 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full"></div>
              <span class="text-gray-400 text-sm font-medium">JUP Staked</span>
            </div>
            <div class="text-white text-2xl font-bold">100.00%</div>
          </div>
        </div>
      </div>

      <!-- Right Column (3/5 width) - Chart Section -->
      <div class="lg:col-span-3 relative">
        
        <!-- Chart Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-4">
            <button class="text-gray-400 hover:text-white transition-colors p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </button>
            <button class="text-gray-400 hover:text-white transition-colors p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
            <div class="bg-green-500/20 text-green-400 text-sm px-3 py-1.5 rounded-lg font-medium">Chart</div>
          </div>
          
          <!-- Time Period Buttons -->
          <div class="flex items-center space-x-4">
            <button class="text-gray-400 hover:text-white px-3 py-1 text-sm transition-colors">1D</button>
            <button class="text-gray-400 hover:text-white px-3 py-1 text-sm transition-colors">1W</button>
            <button class="text-gray-400 hover:text-white px-3 py-1 text-sm transition-colors">1M</button>
            <button class="text-teal-400 font-medium px-3 py-1 text-sm">3M</button>
          </div>
        </div>

        <!-- Chart Area with Background -->
        <div class="relative bg-gray-800/30 rounded-2xl border border-gray-700/50 h-96 overflow-hidden">
          <!-- Background Pattern/Grid -->
          <div class="absolute inset-0 opacity-10">
            <svg class="w-full h-full" viewBox="0 0 800 400">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <!-- Chart Locked Content -->
          <div class="relative z-10 flex flex-col items-center justify-center h-full">
            <!-- Jupiter Character -->
            <div class="relative mb-6">
              <img 
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjMwIiBmaWxsPSIjNDFCODgzIi8+CjxjaXJjbGUgY3g9IjQyIiBjeT0iMzUiIHI9IjMiIGZpbGw9IiMxRjJBMzciLz4KPGNpcmNsZSBjeD0iNTgiIGN5PSIzNSIgcj0iMyIgZmlsbD0iIzFGMkEzNyIvPgo8cGF0aCBkPSJNNDAgNTBRNTAgNTUgNjAgNTAiIHN0cm9rZT0iIzFGMkEzNyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxyZWN0IHg9IjQ1IiB5PSI3MCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRkY2MzQ3Ii8+Cjwvc3ZnPgo="
                alt="Jupiter Character"
                class="w-24 h-24 filter drop-shadow-lg"
              />
            </div>
            
            <h3 class="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
              <span>Chart Locked</span>
              <span class="text-xl">🔒</span>
            </h3>
            
            <p class="text-gray-400 text-center mb-6 max-w-md text-base leading-relaxed">
              You have to connect with Jupiter Wallet Extension or Jupiter Mobile to access this feature.
            </p>
            
            <button class="bg-green-500 hover:bg-green-600 text-black font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg">
              Use Jupiter Wallet
            </button>

            <!-- Date Labels at Bottom -->
            <div class="absolute bottom-4 left-6 right-6 flex justify-between text-xs text-gray-500">
              <span>2025-07-27</span>
              <span>2025-08-14</span>
              <span>2025-09-01</span>
              <span>2025-09-19</span>
              <span>2025-10-07</span>
              <span>2025-10-25</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section - Positions and Activity -->
    <div class="border-t border-gray-700/50">
      <div class="flex items-center justify-between px-6 py-4">
        <div class="flex items-center space-x-8">
          <button class="flex items-center space-x-2 text-white font-medium relative">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span>Positions</span>
            <div class="absolute -bottom-5 left-0 right-0 h-0.5 bg-white rounded-full"></div>
          </button>
          <button class="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <span>Activity</span>
          </button>
        </div>
        
        <button class="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
          <span class="text-sm">Collapse</span>
          <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>
      
      <div class="px-6 pb-8">
        <div class="text-center py-16">
          <div class="text-gray-400 text-lg mb-2">No positions to display</div>
          <div class="text-gray-500 text-sm">Connect your wallet to view your positions</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>