import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  variant: string | null;
  size: string | null;
  sku: string | null;
  price: number;
  stock: number;
  is_active: boolean;
}

const empty = { name: "", variant: "", size: "", sku: "", price: "0", stock: "0", is_active: true };

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts((data as Product[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      variant: p.variant ?? "",
      size: p.size ?? "",
      sku: p.sku ?? "",
      price: String(p.price),
      stock: String(p.stock),
      is_active: p.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    const payload = {
      name: form.name.trim(),
      variant: form.variant.trim() || null,
      size: form.size.trim() || null,
      sku: form.sku.trim() || null,
      price: Number(form.price),
      stock: parseInt(form.stock, 10) || 0,
      is_active: form.is_active,
    };
    if (!payload.name) { toast.error("Name is required"); return; }
    const op = editing
      ? supabase.from("products").update(payload).eq("id", editing.id)
      : supabase.from("products").insert(payload);
    const { error } = await op;
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Updated" : "Created");
    setOpen(false);
    load();
  };

  const del = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  const updateStock = async (id: string, stock: number) => {
    const { error } = await supabase.from("products").update({ stock }).eq("id", id);
    if (error) toast.error(error.message);
    else setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, stock } : p)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage catalog and stock levels.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> New product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Variant</Label>
                  <Input value={form.variant} onChange={(e) => setForm({ ...form, variant: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Size</Label>
                  <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between border rounded-md p-3">
                <Label htmlFor="active">Active (visible to wholesalers)</Label>
                <Switch id="active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Variant</th>
              <th className="px-3 py-2 font-medium">Size</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium text-right">Price</th>
              <th className="px-3 py-2 font-medium text-right">Stock</th>
              <th className="px-3 py-2 font-medium">Active</th>
              <th className="px-3 py-2 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No products yet. Add your first one.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.variant || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.size || "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.sku || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(Number(p.price))}</td>
                  <td className="px-3 py-2 text-right">
                    <Input
                      type="number"
                      value={p.stock}
                      onChange={(e) => updateStock(p.id, Math.max(0, parseInt(e.target.value || "0", 10)))}
                      className="w-20 h-8 ml-auto text-right tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Switch checked={p.is_active} onCheckedChange={async (v) => {
                      await supabase.from("products").update({ is_active: v }).eq("id", p.id);
                      setProducts((ps) => ps.map(x => x.id === p.id ? { ...x, is_active: v } : x));
                    }} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => del(p)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
