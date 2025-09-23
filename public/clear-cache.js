// Script para limpar cache do browser
(function() {
  'use strict';
  
  // Limpar todos os caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }
  
  // Limpar localStorage
  try {
    localStorage.clear();
  } catch (e) {
    console.log('Erro ao limpar localStorage:', e);
  }
  
  // Limpar sessionStorage
  try {
    sessionStorage.clear();
  } catch (e) {
    console.log('Erro ao limpar sessionStorage:', e);
  }
  
  console.log('🧹 Cache limpo com sucesso!');
})();
