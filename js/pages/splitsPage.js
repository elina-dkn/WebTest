import { getSplits, deleteSplitAndMemberships } from "../services/splitService.js";
import { createSplitCard } from "../components/splitCard.js";
import { openSplitDialog } from "../components/splitDialog.js";
import { clear, showEmpty, showLoading } from "../components/dom.js";
import { initPage } from "./common.js";

const list = document.getElementById("list");

async function render(user) {
  showLoading(list);
  const splits = await getSplits(user);

  if (splits.length === 0) {
    showEmpty(list, "No splits yet. Add a split to organize your workouts.");
    return;
  }

  clear(list);
  for (const split of splits) {
    list.appendChild(
      createSplitCard({
        split,
        onOpen: () => openSplitDialog({ user, split, onChanged: () => render(user) }),
        onDelete: () => deleteSplitAndMemberships(user, split.id)
      })
    );
  }
}

initPage((user) => render(user)).catch(console.error);
