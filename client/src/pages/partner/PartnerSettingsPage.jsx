import { useCallback, useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { catalogService } from "../../services/catalog/catalogService.js";
import { partnerService } from "../../services/portals/partnerService.js";
import { formatMoney } from "../../utils/format.js";

export function PartnerSettingsPage() {
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState(null);
  const load = useCallback(async () => {
    const [vendor, buildings] = await Promise.all([
      partnerService.vendor(),
      catalogService.buildings({ limit: 50 }),
    ]);
    return { vendor: vendor.data, buildings: buildings.data };
  }, []);
  const { data, loading, error, reload } = useApiResource(load);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  async function saveProfile(event) {
    event.preventDefault();
    setNotice("");
    setActionError(null);
    const form = new FormData(event.currentTarget);
    try {
      await partnerService.updateVendor({
        description: form.get("description"),
        contactEmail: form.get("contactEmail"),
        contactPhone: form.get("contactPhone") || null,
        pickupEnabled: form.get("pickupEnabled") === "on",
        deliveryEnabled: form.get("deliveryEnabled") === "on",
        isOpen: form.get("isOpen") === "on",
        estimatedMinMinutes: Number(form.get("estimatedMinMinutes")),
        estimatedMaxMinutes: Number(form.get("estimatedMaxMinutes")),
      });
      setNotice("Vendor settings saved.");
      reload();
    } catch (caught) {
      setActionError(caught);
    }
  }

  async function saveZone(event) {
    event.preventDefault();
    setNotice("");
    setActionError(null);
    const form = new FormData(event.currentTarget);
    try {
      await partnerService.saveDeliveryZone({
        buildingId: Number(form.get("buildingId")),
        feeAgorot: Math.round(Number(form.get("fee")) * 100),
        minimumOrderAgorot: Math.round(Number(form.get("minimum")) * 100),
        etaMinMinutes: Number(form.get("etaMin")),
        etaMaxMinutes: Number(form.get("etaMax")),
        isActive: form.get("isActive") === "on",
      });
      setNotice("Delivery zone saved.");
      event.currentTarget.reset();
      reload();
    } catch (caught) {
      setActionError(caught);
    }
  }

  const vendor = data.vendor;
  return (
    <div className="portal-page">
      <PageHeader eyebrow="Storefront" title="Vendor settings" description={`${vendor.name} · ${vendor.building_name}`} />
      {notice && <p className="success-notice">{notice}</p>}
      {actionError && <ErrorState error={actionError} />}
      <div className="settings-grid">
        <form className="card" onSubmit={saveProfile}>
          <h2>Public profile</h2>
          <label>Description<textarea name="description" defaultValue={vendor.description} minLength={20} maxLength={800} required /></label>
          <div className="field-row"><label>Contact email<input name="contactEmail" type="email" defaultValue={vendor.contact_email} required /></label><label>Contact phone<input name="contactPhone" defaultValue={vendor.contact_phone ?? ""} /></label></div>
          <div className="field-row"><label>Minimum minutes<input name="estimatedMinMinutes" type="number" min="1" defaultValue={vendor.estimated_min_minutes} required /></label><label>Maximum minutes<input name="estimatedMaxMinutes" type="number" min="1" defaultValue={vendor.estimated_max_minutes} required /></label></div>
          <div className="check-grid">
            <label className="check-field"><input name="isOpen" type="checkbox" defaultChecked={vendor.is_open} /> Open now</label>
            <label className="check-field"><input name="pickupEnabled" type="checkbox" defaultChecked={vendor.pickup_enabled} /> Pickup enabled</label>
            <label className="check-field"><input name="deliveryEnabled" type="checkbox" defaultChecked={vendor.delivery_enabled} /> Delivery enabled</label>
          </div>
          <button className="button button--primary">Save profile</button>
        </form>
        <section className="card">
          <h2>Delivery zones</h2>
          <div className="zone-list">
            {vendor.deliveryZones.map((zone) => (
              <div key={zone.building_id}><span><strong>{zone.building_name}</strong><small>{zone.eta_min_minutes}–{zone.eta_max_minutes} min · minimum {formatMoney(zone.minimum_order_agorot)}</small></span><strong>{formatMoney(zone.fee_agorot)}</strong></div>
            ))}
            {!vendor.deliveryZones.length && <p className="muted">No delivery zones configured.</p>}
          </div>
          <form className="zone-form" onSubmit={saveZone}>
            <label>Building<select name="buildingId" required><option value="">Choose building</option>{data.buildings.map((building) => <option key={building.id} value={building.id}>{building.short_name}</option>)}</select></label>
            <div className="field-row"><label>Fee (ILS)<input name="fee" type="number" min="0" step="0.01" required /></label><label>Minimum order (ILS)<input name="minimum" type="number" min="0" step="0.01" required /></label></div>
            <div className="field-row"><label>ETA minimum<input name="etaMin" type="number" min="1" required /></label><label>ETA maximum<input name="etaMax" type="number" min="1" required /></label></div>
            <label className="check-field"><input name="isActive" type="checkbox" defaultChecked /> Zone active</label>
            <button className="button button--secondary">Add or update zone</button>
          </form>
        </section>
      </div>
    </div>
  );
}
