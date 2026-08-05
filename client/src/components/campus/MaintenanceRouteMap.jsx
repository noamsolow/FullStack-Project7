import { CampusRouteMap } from "./CampusRouteMap.jsx";
import { StatusChip } from "../ui/StatusChip.jsx";
import { titleCase } from "../../utils/format.js";

export function MaintenanceRouteMap({ route, onManageTicket }) {
  return (
    <CampusRouteMap
      route={route}
      itemsKey="tickets"
      itemNoun="maintenance task"
      title="Follow the numbered campus stops"
      imageAlt="Aerial campus map with the recommended maintenance route"
      depotLabel="Base"
      renderItem={(ticket) => (
        <article key={ticket.public_id}>
          <div>
            <small>{ticket.ticket_number} · {titleCase(ticket.category)}</small>
            <strong>{ticket.title}</strong>
            <span>{ticket.location_text}</span>
          </div>
          <div>
            <StatusChip status={ticket.priority} />
            <button type="button" className="text-button" onClick={() => onManageTicket(ticket)}>Manage</button>
          </div>
        </article>
      )}
    />
  );
}
