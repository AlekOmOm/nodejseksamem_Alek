
# Component Library - User Flow Documentation

## Overview
This documentation focuses on the user journey through the VM Orchestrator interface, showing how components interact and what triggers state changes.

## Main Dashboard Layout
```
Dashboard.svelte (main container)
├── VMManagementPanel.svelte (left sidebar)
│   └── VMSidebar.svelte (VM list)
│       └── VM.svelte (individual VM cards)
└── ExecutionPanel.svelte (main content area)
    ├── ExecutionTab.svelte (default active tab)
    └── HistoryTab.svelte (job history)
```

## User Journey Flows

### 1. VM Selection Flow
**User Action**: Click on a VM in the sidebar
**Component Flow**:
```
VMSidebar.svelte
  VM.svelte (user clicks VM card)
    -> Updates selectedVM in ui.state
    -> ExecutionTab.svelte reacts to selectedVM change
    -> CommandGrid.svelte loads commands for selected VM
```

### 2. Command Management Flow

#### Initial State - ExecutionTab
**What User Sees**: Grid of command cards for the selected VM
```
ExecutionTab.svelte
  CommandGrid.svelte (displays commands in responsive grid)
    Command.svelte (individual command cards with execute/edit/delete buttons)
```

#### Add Command Flow
**User Action**: Click "Add Command" button
**Component Flow**:
```
ExecutionTab.svelte
  (Add Command button clicked)
    -> showAddForm = true
    -> AddCommandForm.svelte (modal opens)
      -> CommandForm.svelte (form fields for command creation)
        -> User fills form and submits
        -> commandStore.createCommand() called
        -> Modal closes, CommandGrid refreshes
```

#### Edit Command Flow
**User Action**: Click edit button on command card
**Component Flow**:
```
Command.svelte
  (Edit button clicked)
    -> EditCommandModal.svelte (modal opens)
      -> CommandForm.svelte (pre-populated with command data)
        -> User modifies and submits
        -> commandStore.updateCommand() called
        -> Modal closes, CommandGrid refreshes
```

#### Delete Command Flow
**User Action**: Click delete button on command card
**Component Flow**:
```
Command.svelte
  (Delete button clicked)
    -> DeleteConfirmModal.svelte (confirmation modal)
      -> User confirms deletion
      -> commandStore.deleteCommand() called
      -> Modal closes, CommandGrid refreshes
```

### 3. Command Execution Flow
**User Action**: Click execute button on command card
**Component Flow**:
```
Command.svelte
  (Execute button clicked)
    -> CommandExecutor.executeCommand() called
    -> JobService.executeCommand() via WebSocket
    -> Terminal.svelte (shows at bottom of ExecutionTab)
      -> Log.svelte (displays streaming logLines)
        -> Real-time updates as command executes
        -> Auto-scrolls to show latest output
```

**State Changes During Execution**:
- Command card shows loading spinner
- Execute buttons disabled globally
- Terminal component becomes visible
- Log lines stream in real-time via WebSocket

### 4. Job History Flow
**User Action**: Click "History" tab
**Component Flow**:
```
ExecutionPanel.svelte
  (History tab selected)
    -> HistoryTab.svelte (displays past executions)
      -> JobHistory.svelte (list of completed jobs)
        -> Shows job details, timestamps, status
```

## Component Interaction Patterns

### Modal Components
- **CommandForm.svelte**: Used in both Add and Edit flows
- **DeleteConfirmModal.svelte**: Confirmation dialog for deletions
- **Dialog.svelte**: Base modal wrapper component

### State Management
- **selectedVM**: Managed in ui.state, triggers command loading
- **commands**: Managed in commandStore, reactive to CRUD operations
- **currentJob**: Managed in jobStore, shows execution status
- **logLines**: Managed in jobStore, streams execution output

### Real-time Updates
- **WebSocket Connection**: Provides live command output
- **Reactive Stores**: Components auto-update when state changes
- **Terminal Auto-scroll**: Follows command output in real-time

## Key User Experience Points

1. **VM Selection**: Immediately loads and displays commands
2. **Command Execution**: Provides instant feedback with loading states
3. **Real-time Output**: Shows command progress as it happens
4. **Modal Workflows**: Clean, focused interfaces for CRUD operations
5. **Responsive Grid**: Commands display optimally on different screen sizes

## Developer Notes

- All modals use the base `Dialog.svelte` component
- Command execution is centralized through `CommandExecutor` service
- State changes trigger reactive updates across all components
- WebSocket integration provides real-time execution feedback
- Error handling displays user-friendly messages via alert system

