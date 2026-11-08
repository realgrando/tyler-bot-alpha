#!/usr/bin/env python3
"""
VAULT KINETIC ENGINE (v4.0 — 5-Year Proof)
Motor de Estado e Termodinâmica Autônoma do Segundo Cérebro.
Implementa as 4 Leis Cinéticas:
  1. Ignição (Auto-Wake): Propaga calor de filhos/PoW para os pais.
  2. Progressão (Auto-Rollup): Calcula Current / Target e propaga ratios como Integer (0..100).
  3. Conclusão (Auto-Close): Seta done e grava Completed_At: 'DD-MM-YYYY HH:mm' quando Current >= Target.
  4. Resfriamento (Auto-Pause): Congela entidades in_progress sem PoW por >= inertia_ttl dias.
"""

import os
import re
import sys
import argparse
from datetime import datetime, timedelta

VAULT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))

YAML_PATTERN = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)

def parse_frontmatter(content):
    m = YAML_PATTERN.match(content)
    if not m:
        return {}, content
    raw = m.group(1)
    body = content[m.end():]
    props = {}
    lines = raw.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip() or line.strip().startswith("#"):
            i += 1
            continue
        if ":" in line:
            k, v = line.split(":", 1)
            k = k.strip()
            v = v.strip()
            # Check for list
            if v == "":
                # Could be empty scalar or start of a list
                list_items = []
                j = i + 1
                while j < len(lines) and (lines[j].startswith("  - ") or lines[j].strip() == ""):
                    if lines[j].startswith("  - "):
                        item_val = lines[j][4:].strip().strip('"').strip("'")
                        list_items.append(item_val)
                    j += 1
                if list_items:
                    props[k] = list_items
                    i = j
                    continue
                else:
                    props[k] = ""
            else:
                v_clean = v.strip('"').strip("'")
                if v_clean.lower() == "true":
                    props[k] = True
                elif v_clean.lower() == "false":
                    props[k] = False
                elif v_clean.isdigit():
                    props[k] = int(v_clean)
                else:
                    try:
                        props[k] = float(v_clean)
                    except ValueError:
                        props[k] = v_clean
        i += 1
    return props, body

def dump_frontmatter(props, body):
    lines = ["---"]
    for k, v in props.items():
        if isinstance(v, bool):
            lines.append(f"{k}: {str(v).lower()}")
        elif isinstance(v, int):
            lines.append(f"{k}: {v}")
        elif isinstance(v, float):
            lines.append(f"{k}: {v}")
        elif isinstance(v, str):
            if v.startswith("[[") and v.endswith("]]"):
                lines.append(f'{k}: "{v}"')
            elif any(c in v for c in [":", "#", "@", "%"]):
                lines.append(f'{k}: "{v}"')
            else:
                lines.append(f"{k}: {v}")
        elif isinstance(v, list):
            lines.append(f"{k}:")
            for item in v:
                lines.append(f"  - {item}")
        elif v is None:
            lines.append(f"{k}:")
        else:
            lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines) + "\n\n" + body.lstrip()

class KineticEngine:
    def __init__(self, root_dir):
        self.root = root_dir
        self.notes = {}
        self.load_vault()

    def load_vault(self):
        self.notes = {}
        for root, _, files in os.walk(self.root):
            if ".obsidian" in root or "Configs" in root or "Archive" in root or "Limbo" in root:
                continue
            for file in files:
                if file.endswith(".md"):
                    path = os.path.join(root, file)
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                    props, body = parse_frontmatter(content)
                    mtime = datetime.fromtimestamp(os.path.getmtime(path))
                    self.notes[file[:-3]] = {
                        "name": file[:-3],
                        "path": path,
                        "props": props,
                        "body": body,
                        "mtime": mtime,
                        "class": props.get("Class", "classBase"),
                        "status": str(props.get("Status", "")).lower().strip(),
                        "parent": str(props.get("Parent", "")).strip().replace("[[", "").replace("]]", ""),
                        "current": props.get("Current"),
                        "target": props.get("Target"),
                        "unit": props.get("Unit", ""),
                        "ttl": int(props.get("inertia_ttl", 3)) if str(props.get("inertia_ttl", "")).isdigit() else 3
                    }

    def save_note(self, note):
        st = os.stat(note["path"])
        new_content = dump_frontmatter(note["props"], note["body"])
        with open(note["path"], "w", encoding="utf-8") as f:
            f.write(new_content)
        os.utime(note["path"], (st.st_atime, st.st_mtime))

    def run_cycle(self, dry_run=False):
        report = []
        now = datetime.now()

        # 1. Lei da Conclusão (Auto-Close) & Progressão (Auto-Rollup Integer)
        for name, n in self.notes.items():
            curr = n.get("current")
            targ = n.get("target")

            # Normalização de Progress para Integer
            if "Progress" in n["props"]:
                val = n["props"]["Progress"]
                if isinstance(val, str) and "%" in val:
                    try:
                        n["props"]["Progress"] = int(val.replace("%", "").strip())
                    except ValueError:
                        pass

            if curr is not None and targ is not None and isinstance(curr, (int, float)) and isinstance(targ, (int, float)) and targ > 0:
                prog = round((curr / targ) * 100)
                if n["props"].get("Progress") != int(prog):
                    n["props"]["Progress"] = int(prog)
                    report.append(f"[PROGRESSO] {name} ({n['class']}): Progress atualizado para {prog}%.")
                    if not dry_run:
                        self.save_note(n)

                if curr >= targ and n["status"] not in ["done", "completed", "canceled"]:
                    n["props"]["Status"] = "done"
                    n["props"]["Completed_At"] = now.strftime("%d-%m-%Y %H:%M")
                    if "DoneAt" in n["props"]:
                        del n["props"]["DoneAt"]
                    report.append(f"[CONCLUSAO] {name} ({n['class']}): Current ({curr}) >= Target ({targ}). Status -> done, Completed_At gravado.")
                    if not dry_run:
                        self.save_note(n)

        # 2. Resfriamento (Auto-Pause) — Indexação O(N) de filhos por Parent + Memoização
        children_by_parent = {}
        for c_name, c in self.notes.items():
            par = c.get("parent")
            if par:
                children_by_parent.setdefault(par, []).append(c_name)

        memo_activity = {}
        def get_deep_activity(note_name, visited=None):
            if note_name in memo_activity:
                return memo_activity[note_name]
            if visited is None:
                visited = set()
            if note_name in visited or note_name not in self.notes:
                return datetime.min
            visited.add(note_name)
            max_act = self.notes[note_name]["mtime"]
            for c_name in children_by_parent.get(note_name, []):
                c_act = get_deep_activity(c_name, visited)
                if c_act > max_act:
                    max_act = c_act
            memo_activity[note_name] = max_act
            return max_act

        for name, n in self.notes.items():
            # Notas permanentes / folhas (Zettel, Literature e Doc) e Metas Macro Anuais não sofrem Auto-Pause de curto prazo
            horiz = str(n["props"].get("Horizon", "")).lower().strip()
            if n["status"] == "in_progress" and n["class"] not in ["classZettel", "classLiterature", "classDoc"] and horiz != "annual":
                last_activity = get_deep_activity(name)
                days_idle = (now - last_activity).days
                if days_idle >= n["ttl"]:
                    n["props"]["Status"] = "paused"
                    report.append(f"[RESFRIAMENTO] {name} ({n['class']}): {days_idle} dias sem PoW (TTL: {n['ttl']}). Status -> paused.")
                    if not dry_run:
                        self.save_note(n)

        return report

def main():
    parser = argparse.ArgumentParser(description="Vault Kinetic Engine v4.0")
    parser.add_argument("--root", default=VAULT_ROOT, help="Vault Root")
    parser.add_argument("--tick", action="store_true", help="Run kinetic cycle")
    parser.add_argument("--dry-run", action="store_true", help="Simulate execution")
    args = parser.parse_args()

    engine = KineticEngine(args.root)
    print(f"Loaded {len(engine.notes)} notes into Kinetic Engine.")
    reports = engine.run_cycle(dry_run=args.dry_run)
    if reports:
        print(f"Engine executed {len(reports)} state transitions / updates:")
        for r in reports:
            print("  " + r)
    else:
        print("Engine status: All entities in thermal equilibrium. Zero anomalies.")

if __name__ == "__main__":
    main()
