import { useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

/**
 * A custom hook to execute Next.js Server Actions with automated loading and toast notifications.
 * It automatically handles redirects and data revalidation.
 * 
 * @param {Function} action - The server action function to execute.
 * @param {Object} options
 * @param {string} options.loadingMessage - Message to show while the action is processing.
 * @param {string} options.successMessage - Message to show when the action completes successfully.
 * @param {Function} [options.onSuccess] - Callback to run on successful execution.
 * @returns {[Function, boolean]} A tuple of [runAction, isPending].
 */
export function useFormAction(action, { loadingMessage = 'Processing...', successMessage = 'Success!', onSuccess } = {}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const runAction = async (dataOrEvent) => {
    let payload = dataOrEvent

    // If it's a form submit event, prevent default and extract form data
    if (dataOrEvent && typeof dataOrEvent.preventDefault === 'function') {
      dataOrEvent.preventDefault()
      payload = new FormData(dataOrEvent.currentTarget)
    }

    startTransition(async () => {
      try {
        const result = await action(payload)
        
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success(successMessage || result?.message || 'Success!')
          
          if (result?.redirect) {
            router.push(result.redirect)
          } else {
            router.refresh()
          }

          if (onSuccess) {
            onSuccess(result)
          }
        }
      } catch (err) {
        toast.error(err.message || 'Operation failed')
      }
    })
  }

  return [runAction, isPending]
}
