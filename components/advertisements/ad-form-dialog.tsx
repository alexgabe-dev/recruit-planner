"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useStore } from "@/lib/db-store"
import type { Ad, Partner, AdStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  positionName: z.string().min(1, "Kötelező mező"),
  adContent: z.string().min(1, "Kötelező mező"),
  type: z.enum(["kampány", "post", "kiemelt post"]),
  partnerId: z.number().min(1, "Válasszon partnert"),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface AdFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  ad?: Ad & { partner?: Partner; status?: AdStatus }
}

export function AdFormDialog({ open, onOpenChange, mode, ad }: AdFormDialogProps) {
  const { partners, addAd, updateAd } = useStore()
  const [partnerOpen, setPartnerOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      positionName: "",
      adContent: "",
      type: "post",
      partnerId: 0,
      startDate: new Date(),
      endDate: new Date(),
      isActive: true,
    },
  })

  useEffect(() => {
    if (ad && mode === "edit") {
      form.reset({
        positionName: ad.positionName,
        adContent: ad.adContent,
        type: ad.type,
        partnerId: ad.partnerId,
        startDate: new Date(ad.startDate),
        endDate: new Date(ad.endDate),
        isActive: ad.isActive,
      })
    } else if (mode === "create") {
      form.reset({
        positionName: "",
        adContent: "",
        type: "post",
        partnerId: partners[0]?.id || 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      })
    }
  }, [ad, mode, form, partners])

  const onSubmit = (data: FormData) => {
    if (mode === "create") {
      addAd(data)
      toast.success("Hirdetés sikeresen létrehozva!")
    } else if (ad) {
      updateAd(ad.id, data)
      toast.success("Hirdetés sikeresen frissítve!")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Új hirdetés" : "Hirdetés szerkesztése"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="partnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner</FormLabel>
                  <Popover open={partnerOpen} onOpenChange={setPartnerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {(() => {
                            const current = partners.find((p) => p.id === field.value)
                            return current ? `${current.name} - ${current.office}` : "Válasszon partnert"
                          })()}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Partner keresése..." />
                        <CommandList>
                          <CommandEmpty>Nincs találat</CommandEmpty>
                          <CommandGroup heading="Partnerek">
                            {partners.map((partner) => (
                              <CommandItem
                                key={partner.id}
                                value={`${partner.name} ${partner.office}`}
                                onSelect={() => {
                                  field.onChange(partner.id)
                                  setPartnerOpen(false)
                                }}
                              >
                                {partner.name} - {partner.office}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="positionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Munkakör</FormLabel>
                  <FormControl>
                    <Input placeholder="pl. Raktári operátor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hirdetés szövege</FormLabel>
                  <FormControl>
                    <Textarea placeholder="pl. Csatlakozz dinamikus csapatunkhoz!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Típus</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="kampány">Kampány</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="kiemelt post">Kiemelt post</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Kezdés dátuma</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? (
                              format(field.value, "yyyy. MM. dd.", { locale: hu })
                            ) : (
                              <span>Válasszon dátumot</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={hu}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Befejezés dátuma</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? (
                              format(field.value, "yyyy. MM. dd.", { locale: hu })
                            ) : (
                              <span>Válasszon dátumot</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={hu}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Mégse
              </Button>
              <Button type="submit">{mode === "create" ? "Létrehozás" : "Mentés"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
