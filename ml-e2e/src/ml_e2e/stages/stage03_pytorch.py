"""Stage 3: PyTorch — tiny MLP on sklearn digits (backprop + training loop)."""

from __future__ import annotations

import json

import torch
import torch.nn as nn
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader, TensorDataset

from ml_e2e.config import ARTIFACTS


class MLP(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(64, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 10),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


def main() -> None:
    X, y = load_digits(return_X_y=True)
    X = StandardScaler().fit_transform(X)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    train_ds = TensorDataset(
        torch.tensor(X_train, dtype=torch.float32),
        torch.tensor(y_train, dtype=torch.long),
    )
    loader = DataLoader(train_ds, batch_size=32, shuffle=True)

    model = MLP()
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.CrossEntropyLoss()

    model.train()
    for epoch in range(8):
        epoch_loss = 0.0
        for xb, yb in loader:
            opt.zero_grad()
            loss = loss_fn(model(xb), yb)
            loss.backward()
            opt.step()
            epoch_loss += loss.item()
        print(f"epoch {epoch + 1} loss={epoch_loss / len(loader):.4f}")

    model.eval()
    with torch.no_grad():
        logits = model(torch.tensor(X_test, dtype=torch.float32))
        acc = (logits.argmax(1) == torch.tensor(y_test)).float().mean().item()

    path = ARTIFACTS / "digits_mlp.pt"
    torch.save(model.state_dict(), path)
    metrics = {"test_accuracy": acc, "epochs": 8}
    (ARTIFACTS / "stage03_metrics.json").write_text(json.dumps(metrics, indent=2))
    print(f"Stage 3 — test_accuracy={acc:.3f}, weights → {path}")


if __name__ == "__main__":
    main()