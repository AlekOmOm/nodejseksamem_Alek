/* src/lib/state/ui.command.state.svelte.js
 *
 * Command UI state singleton with private $state and public accessors
 */

/* ── private reactive fields ── */
let _editingCommandId = $state(null);
let _deletingCommandId = $state(null);

/* ── public read-only accessors ── */
export function getEditingCommandId() {
   return _editingCommandId;
}

export function getDeletingCommandId() {
   return _deletingCommandId;
}

/* ── public actions that mutate state ── */
export function startEditCommand(commandId) {
   _editingCommandId = commandId;
}

export function stopEditCommand() {
   _editingCommandId = null;
}

export function startDeleteCommand(commandId) {
   _deletingCommandId = commandId;
}

export function stopDeleteCommand() {
   _deletingCommandId = null;
}

/* ── derived state helpers ── */
export function isEditingCommand(commandId) {
   return _editingCommandId === commandId;
}

export function isDeletingCommand(commandId) {
   return _deletingCommandId === commandId;
}