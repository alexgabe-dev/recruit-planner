"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/db-store"
import type { Partner } from "@/lib/types"
import { toast } from "sonner"

const formSchema = z.object({
  name: z.string().min(1, "Kötelező mező"),
  office: z.string().min(1, "Kötelező mező"),
})

type FormData = z.infer<typeof formSchema>

interface PartnerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  partner?: Partner
}

export function PartnerFormDialog({ open, onOpenChange, mode, partner }: PartnerFormDialogProps) {
  const { addPartner, updatePartner } = useStore()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      office: "",
    },
  })

  useEffect(() => {
    if (partner && mode === "edit") {
      form.reset({
        name: partner.name,
        office: partner.office,
      })
    } else if (mode === "create") {
      form.reset({
        name: "",
        office: "",
      })
    }
  }, [partner, mode, form])

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "create") {
        await addPartner(data)
        toast.success("Partner sikeresen létrehozva!")
      } else if (partner) {
        await updatePartner(partner.id, data)
        toast.success("Partner sikeresen frissítve!")
      }
      onOpenChange(false)
    } catch (error) {
      toast.error("Hiba történt a mentés során")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Új partner" : "Partner szerkesztése"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner neve</FormLabel>
                  <FormControl>
                    <Input placeholder="pl. Bárdi Autó" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="office"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Iroda</FormLabel>
                  <FormControl>
                    <Input placeholder="pl. Budapest" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
