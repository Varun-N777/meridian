import os

for root, _, files in os.walk('app'):
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.read().split('\n')
            
            # Remove all occurrences
            lines = [line for line in lines if line.strip() != "from __future__ import annotations"]
            
            # Determine correct insertion index
            insert_idx = 0
            if len(lines) > 0:
                first_line = lines[0].strip()
                if first_line.startswith('"""') and first_line.endswith('"""') and len(first_line) >= 6:
                    insert_idx = 1
                elif first_line.startswith('"""'):
                    for i in range(1, len(lines)):
                        if '"""' in lines[i]:
                            insert_idx = i + 1
                            break
                elif first_line.startswith("'''") and first_line.endswith("'''") and len(first_line) >= 6:
                    insert_idx = 1
                elif first_line.startswith("'''"):
                    for i in range(1, len(lines)):
                        if "'''" in lines[i]:
                            insert_idx = i + 1
                            break
            
            lines.insert(insert_idx, "from __future__ import annotations")
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
