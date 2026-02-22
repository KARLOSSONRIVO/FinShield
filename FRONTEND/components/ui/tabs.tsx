'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { value: string }) {
  // We use Context via Radix internals implicitly or just check data-state to see if active.
  // Radix UI Tabs handles internal state but we can inject motion.div conditionally based on state externally 
  // if we control it, but the easiest way here is utilizing Radix's data-[state=active] and CSS,
  // OR since Radix gives us little control over the raw active state for Framer Motion, we render a generic background.
  // Wait, framer-motion needs to know the shared layoutId, which Radix UI hides.
  // Let's implement it inside the trigger by checking a standard prop or using CSS for now.
  // A better way is using a local context or just letting the parent handle it, but for a global Tabs component,
  // we can add a generic layoutId if we had access to the selected value.
  // We will instead adjust the parent component (SettingsPage) to use motion.div themselves if they want.
  // But wait, the user asked to modify the general Tabs component? No, the standard way in shadcn for animated tabs is this:

  return (
    <TabsPrimitive.Trigger
      value={value}
      data-slot="tabs-trigger"
      className={cn(
        "relative data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:text-foreground text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 z-10",
        className,
      )}
      {...props}
    >
      {/* We need to know if it's active to render the motion.div. A simple way in React is to just use a custom Tabs system, but since this is Radix, we can't easily read `state=active` in React land without Context. 
          Actually, Radix passes data-state="active" to the DOM, not React state. 
          Therefore, we should modify the parent (SettingsPage) to handle the custom animated tabs! */}
      {props.children}
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
