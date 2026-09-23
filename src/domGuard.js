// src/domGuard.js
// Protège React des crashs causés par des modifications externes du DOM
// (Google Translate, extensions, etc.)

if (typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child.parentNode !== this) {
      console.warn('[domGuard] removeChild annulé : le nœud n\'est plus un enfant de son parent.');
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      console.warn('[domGuard] insertBefore annulé : le nœud de référence n\'est plus un enfant de son parent.');
      // Fallback : on ajoute à la fin plutôt que de planter
      return this.appendChild(newNode);
    }
    return originalInsertBefore.apply(this, arguments);
  };
}