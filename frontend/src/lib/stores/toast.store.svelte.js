import { toast } from 'svelte-sonner';

// Centralized toast actions with consistent messaging
export const toastActions = {
  // VM operations
  vm: {
    created: (vmName) => toast.success(`VM "${vmName}" created successfully!`),
    updated: (vmName) => toast.success(`VM "${vmName}" updated successfully!`),
    deleted: (vmName) => toast.success(`VM "${vmName}" deleted successfully!`),
    error: (action, error) => toast.error(`Failed to ${action} VM`, { 
      description: error.message || 'An unexpected error occurred' 
    })
  },

  // Command operations  
  command: {
    created: (commandName, vmName) => toast.success(`Command "${commandName}" created!`, {
      description: `Added to ${vmName}`
    }),
    updated: (commandName) => toast.success(`Command "${commandName}" updated!`),
    deleted: (commandName) => toast.success(`Command "${commandName}" deleted!`),
    executed: (commandName) => toast.info(`Executing "${commandName}"...`),
    error: (action, error) => {
      // Handle specific error types with user-friendly messages
      if (error.message?.includes('409') || error.message?.includes('already exists')) {
        toast.error('Name already exists', { 
          description: 'Please choose a different name for your command.' 
        });
      } else if (error.message?.includes('422') || error.message?.includes('validation')) {
        toast.error('Invalid input', { 
          description: error.message || 'Please check your command details.' 
        });
      } else if (error.message?.includes('404') || error.message?.includes('not found')) {
        toast.error('VM not found', { 
          description: 'Please refresh the page and try again.' 
        });
      } else {
        toast.error(`Failed to ${action} command`, { 
          description: error.message || 'Please try again or contact support if the problem persists.' 
        });
      }
    }
  },

  // Auth operations
  auth: {
    loginSuccess: (email) => toast.success(`Welcome back!`, {
      description: `Logged in as ${email}`
    }),
    loginError: (error) => toast.error('Login failed', {
      description: error.message || 'Please check your credentials and try again.'
    }),
    registerSuccess: (email) => toast.success(`Account created successfully!`, {
      description: `Welcome ${email}! You can now log in.`
    }),
    registerError: (error) => toast.error('Registration failed', {
      description: error.message || 'Please check your details and try again.'
    }),
    userDeleted: () => toast.success('Account deleted successfully', {
      description: 'Your account has been permanently deleted.'
    }),
    allDataDeleted: () => toast.success('All data deleted successfully', {
      description: 'Your account and all associated data have been permanently deleted.'
    }),
    deletionError: (error) => toast.error('Deletion failed', {
      description: error.message || 'Please try again or contact support.'
    })
  },

  // Generic operations
  success: (message, description) => toast.success(message, { description }),
  error: (message, description) => toast.error(message, { description }),
  info: (message, description) => toast.info(message, { description })
};
