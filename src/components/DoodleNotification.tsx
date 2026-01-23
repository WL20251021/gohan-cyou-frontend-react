type NotifOptions = {
  title?: string
  description?: string
  placement?: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft'
  duration?: number
  showProgress?: boolean
  pauseOnHover?: boolean
  [key: string]: any
}

function ensureContainer(placement: string) {
  const id = `doodle-notification-container-${placement}`
  let container = document.getElementById(id)
  if (!container) {
    container = document.createElement('div')
    container.id = id
    container.style.position = 'fixed'
    container.style.zIndex = '9999'
    if (placement === 'topRight') {
      container.style.top = '16px'
      container.style.right = '16px'
    } else if (placement === 'topLeft') {
      container.style.top = '16px'
      container.style.left = '16px'
    } else if (placement === 'bottomLeft') {
      container.style.bottom = '16px'
      container.style.left = '16px'
    } else {
      // bottomRight
      container.style.bottom = '16px'
      container.style.right = '16px'
    }
    document.body.appendChild(container)
  }
  return container
}

function renderNotice(type: 'success' | 'error' | 'info' | 'warning', opts: NotifOptions = {}) {
  const placement = opts.placement || 'bottomRight'
  const container = ensureContainer(placement)

  const notice = document.createElement('div')
  // add placement class so CSS can animate from left/right
  notice.className = `doodle-notice doodle-notice-${type} doodle-notice-placement-${placement}`

  // base styles (CSS handles doodle border/background)
  notice.style.marginTop = '8px'
  notice.style.marginBottom = '8px'
  notice.style.padding = '10px 12px'
  notice.style.minWidth = '220px'
  notice.style.maxWidth = '360px'

  const title = document.createElement('div')
  title.style.fontWeight = '700'
  title.style.marginBottom = opts.description ? '6px' : '0'
  title.textContent = opts.title || ''

  const desc = document.createElement('div')
  desc.style.color = 'var(--color-text-secondary)'
  desc.style.fontSize = '13px'
  desc.textContent = opts.description || ''

  const actions = document.createElement('div')
  actions.style.display = 'flex'
  actions.style.justifyContent = 'flex-end'
  actions.style.marginTop = '8px'
  // If provided title/description, render; otherwise keep minimal
  if (opts.title) notice.appendChild(title)
  if (opts.description) notice.appendChild(desc)

  // progress bar support
  const duration = typeof opts.duration === 'number' ? opts.duration : 4500
  let progressEl: HTMLDivElement | null = null
  let progressTimer: number | null = null
  let autoRemoveTimer: number | null = null
  let startAt = Date.now()
  let remaining = duration

  if (opts.showProgress) {
    const progressWrap = document.createElement('div')
    progressWrap.className = 'doodle-notice-progress-wrap'
    progressWrap.style.marginTop = '8px'
    progressWrap.style.height = '6px'
    progressWrap.style.background = 'rgba(0,0,0,0.04)'
    progressWrap.style.borderRadius = '6px'

    progressEl = document.createElement('div')
    progressEl.className = 'doodle-notice-progress'
    progressEl.style.height = '100%'
    progressEl.style.width = '100%'
    progressEl.style.background = 'var(--color-primary)'
    progressEl.style.borderRadius = '6px'
    progressEl.style.transition = `width ${duration}ms linear`

    progressWrap.appendChild(progressEl)
    notice.appendChild(progressWrap)
  }

  // append before starting animations
  container.appendChild(notice)

  // enter animation (use classes for CSS transitions)
  requestAnimationFrame(() => {
    notice.classList.add('doodle-notice-enter')
    // start progress shrink slightly after enter
    if (progressEl) {
      // force reflow then animate
      requestAnimationFrame(() => {
        progressEl!.style.width = '0%'
      })
    }
  })

  // hover pause handlers (defined here for cleanup closure)
  const onMouseEnter = () => {
    if (!opts.pauseOnHover) return
    if (autoRemoveTimer) {
      window.clearTimeout(autoRemoveTimer)
      autoRemoveTimer = null
      const elapsed = Date.now() - startAt
      remaining = Math.max(0, duration - elapsed)
      if (progressEl) {
        const computed = window.getComputedStyle(progressEl)
        const widthPx = computed.width
        const parentWidth = (progressEl.parentElement as HTMLElement).clientWidth || 1
        const widthPct = (parseFloat(widthPx) / parentWidth) * 100
        progressEl.style.transition = 'none'
        progressEl.style.width = `${widthPct}%`
      }
    }
  }

  const onMouseLeave = () => {
    if (!opts.pauseOnHover) return
    startAt = Date.now()
    if (progressEl) {
      requestAnimationFrame(() => {
        progressEl!.style.transition = `width ${remaining}ms linear`
        progressEl!.style.width = '0%'
      })
    }
    autoRemoveTimer = window.setTimeout(() => remove(), remaining)
  }

  const remove = () => {
    // prevent double removal
    if (!notice.parentElement) return
    // start exit animation
    notice.classList.remove('doodle-notice-enter')
    notice.classList.add('doodle-notice-exit')
    // wait for transitionend or fallback
    const cleanup = () => {
      if (progressTimer) window.clearTimeout(progressTimer)
      if (autoRemoveTimer) window.clearTimeout(autoRemoveTimer)
      if (notice.parentElement) notice.parentElement.removeChild(notice)
      if (container && container.childElementCount === 0 && container.parentElement) {
        container.parentElement.removeChild(container)
      }
      notice.removeEventListener('transitionend', onTransitionEnd)
      // remove hover listeners
      notice.removeEventListener('mouseenter', onMouseEnter)
      notice.removeEventListener('mouseleave', onMouseLeave)
    }
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target === notice) cleanup()
    }
    notice.addEventListener('transitionend', onTransitionEnd)
    // fallback cleanup in case transitionend doesn't fire
    progressTimer = window.setTimeout(cleanup, 400)
  }

  // buttons removed: notifications auto-close or can be paused on hover

  if (opts.pauseOnHover) {
    notice.addEventListener('mouseenter', onMouseEnter)
    notice.addEventListener('mouseleave', onMouseLeave)
  }

  // auto remove after duration
  startAt = Date.now()
  autoRemoveTimer = window.setTimeout(() => remove(), duration)
}
const notification = {
  success: (opts: NotifOptions) => renderNotice('success', opts),
  error: (opts: NotifOptions) => renderNotice('error', opts),
  info: (opts: NotifOptions) => renderNotice('info', opts),
  warn: (opts: NotifOptions) => renderNotice('warning', opts),
  open: (opts: NotifOptions & { type?: any }) => renderNotice((opts as any).type || 'info', opts),
}

export default notification
