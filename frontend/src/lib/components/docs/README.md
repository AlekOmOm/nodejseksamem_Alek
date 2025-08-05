# Component Library


Svelte UI layers
```
Dashboard.svelte
 VMManagementPanel.svelte
   refresh button 
   VMSidebar.svelte
 ExecutionPanel.svelte
    ExecutionTab.svelte
    HistoryTab.svelte
```

## Panels

### VM Management Panel
``` 
VMSidebar.svelte
  (list of VMs)
  VM.svelte - VM card
    VMForm.svelte - edit VM form (modal)
    VMCommands.svelte - list of commands for VM (modal)
```

### Execution Panel
```
ExecutionPanel.svelte
  ExecutionTab.svelte   (default active)
    CommandGrid.svelte   (commands of selected VM)
      Command.svelte     - command card
    addCommand Button    - opens dialog
      Dialog.svelte
        CommandForm.svelte  - create / edit command
    Terminal.svelte       - real-time output
      Log.svelte          - displays logLines after execution
  HistoryTab.svelte       - past job executions
```

## programmatic patterns

### modal dialogs

any (modal) uses Dialog.svelte

this means that where the trigger is, the dialog is.

fx.

```
VM.svelte
  VMForm.svelte
```

```
VM.svelte
  VMCommands.svelte
```

### CRUD pattern

All CRUD flows follow a parent-child component structure where the parent holds the dialog state and renders the modal components alongside their trigger buttons.

```
ExecutionTab.svelte
  (Buttons for Commands)
  AddCommandForm.svelte       - create command (Dialog)
  EditCommandModal.svelte     - edit command (Dialog)
  DeleteConfirmModal.svelte   - delete command (Dialog)
```

The buttons that open these dialogs live in the same component that renders the dialog components, ensuring a tight coupling between the trigger and the modal itself.
