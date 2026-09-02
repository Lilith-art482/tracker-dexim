"use client"

import * as React from "react"

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ")

interface GooeyCtaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string
  icon?: React.ReactNode
  goo?: number
  surface?: string
  ink?: string
}

const GooeyCtaButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  GooeyCtaButtonProps
>(({ className, children, href, icon, goo = 5, surface, ink, style, ...props }, ref) => {
  const filterId = `goo-${React.useId().replace(/:/g, "")}`

  const morph =
    "transition-transform duration-[var(--cta-t)] ease-[var(--cta-ease)] motion-reduce:transition-none"
  const shift =
    "group-hover:translate-x-[calc(var(--cta-pull)*-1)] group-focus-visible:translate-x-[calc(var(--cta-pull)*-1)]"

  const palette = {
    ...(surface ? { "--cta-surface": surface } : null),
    ...(ink ? { "--cta-ink": ink } : null),
    ...style,
  } as React.CSSProperties

  const content = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ filter: `url(#${filterId})` }}
      >
        <span
          className={cx(
            "absolute bottom-0 left-0 top-0 right-[calc(var(--cta-knob)+var(--cta-gap))]",
            "rounded-full bg-[var(--cta-surface)]",
            "transition-[right] duration-[var(--cta-t)] ease-[var(--cta-ease)] motion-reduce:transition-none",
            "group-hover:right-0 group-focus-visible:right-0",
          )}
        />
        <span
          className={cx(
            "absolute right-0 top-1/2 h-[var(--cta-knob)] w-[var(--cta-knob)]",
            "mt-[calc(var(--cta-knob)*-0.5)] rounded-full bg-[var(--cta-surface)]",
            morph,
            shift,
          )}
        />
      </span>

      <span className="relative z-[1]">{children}</span>

      <span
        aria-hidden
        className={cx(
          "absolute z-[1] top-1/2 right-[calc((var(--cta-knob)-var(--cta-dot))*0.5)]",
          "grid h-[var(--cta-dot)] w-[var(--cta-dot)] place-items-center",
          "mt-[calc(var(--cta-dot)*-0.5)] rounded-full",
          "bg-[var(--cta-ink)] text-[var(--cta-surface)]",
          morph,
          shift,
        )}
      >
        <span
          className={cx(
            morph,
            "group-hover:-rotate-90 group-focus-visible:-rotate-90",
          )}
        >
          {icon ?? (
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
              <path
                d="M7 7 17 17M17 7v10H7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </span>

      <svg className="absolute h-0 w-0" aria-hidden focusable="false">
        <filter id={filterId}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={goo} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 34 -17"
          />
        </filter>
      </svg>
    </>
  )

  const shell = cx(
    "[--cta-h:56px] [--cta-knob:52px] [--cta-dot:44px] [--cta-gap:4px] [--cta-pull:10px]",
    "[--cta-pad-l:24px] [--cta-pad-r:26px]",
    "[--cta-surface:#0d0709] [--cta-ink:#ffffff]",
    "dark:[--cta-surface:#ffffff] dark:[--cta-ink:#0d0709]",
    "[--cta-ease:cubic-bezier(.32,.9,.28,1)] [--cta-t:550ms]",
    "max-sm:[--cta-h:48px] max-sm:[--cta-knob:44px] max-sm:[--cta-dot:37px]",
    "max-sm:[--cta-pad-l:18px] max-sm:[--cta-pad-r:20px] max-sm:text-[13px]",
    "group relative inline-flex select-none items-center no-underline",
    "h-[var(--cta-h)] pl-[var(--cta-pad-l)] pr-[calc(var(--cta-knob)+var(--cta-pad-r))]",
    "cursor-pointer appearance-none border-0 bg-transparent",
    "text-[15px] tracking-[0.01em] text-[var(--cta-ink)]",
    className,
  )

  if (href) {
    const anchorProps =
      props as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={shell}
        style={palette}
        {...anchorProps}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={props.type ?? "button"}
      className={shell}
      style={palette}
      {...props}
    >
      {content}
    </button>
  )
})
GooeyCtaButton.displayName = "GooeyCtaButton"

export { GooeyCtaButton }
