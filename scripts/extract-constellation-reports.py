"""Read cached official RES35 PDFs. Emits data only; never executes upstream code.

Usage: python scripts/extract-constellation-reports.py /path/to/report.pdf ...
Requires pypdf. No project files are modified.
"""
import hashlib
import json
import re
import sys
from pypdf import PdfReader

reports = []
for path in sys.argv[1:]:
    texts = [page.extract_text() or '' for page in PdfReader(path).pages]
    planes, bands, names, groups, totals = [], [], [], [], []
    for page, text in enumerate(texts, 1):
        if 'BR111' in text:
            for match in re.finditer(r'^\s*(\d{9})\s+(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+(\d+)\s*$', text, re.M):
                a = match.groups()
                planes.append([a[0], int(a[1]), float(a[2]), float(a[3]), float(a[4]), int(a[6]), int(a[7]), page])
        if 'BR130' in text:
            for match in re.finditer(r'^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(M\d)\s*/\s*(YES|NO)\s*$', text, re.M):
                a = match.groups()
                bands.append(dict(bandId=int(a[0]), minMHz=int(a[1]), maxMHz=int(a[2]), notified=int(a[3]), deployed=int(a[4]), minimum=int(a[5]), milestone=a[6], met=a[7] == 'YES', page=page))
        if 'BR124' in text:
            for match in re.finditer(r'^\s*\d+\s+\d+\s+(\S+)\s+\d+\s+[\d.]+\s+[\d.]+\s+[\d.]+\s+[\d.]+\s+[\d,]+\s*$', text, re.M):
                names.append(match.group(1))
        if 'BR105' in text:
            for match in re.finditer(r'^\s*[AM]\s+(\d{9})\s+\S+\s+[ER]\s+(\d{9})\s+\d+\s*-\s*\d+\s+(\d{2}\.\d{2}\.\d{4})\s+(M\d)\s+(\d{2}\.\d{2}\.\d{4})\s+[YN]\s+(\d{2}\.\d{2}\.\d{4})\s*$', text, re.M):
                groups.append(list(match.groups()))
        match = re.search(r'BR112 Total number.*?BR113 Total number.*?\s(\d+)\s+(\d+)\s*$', text, re.S)
        if match:
            totals.append([int(value) for value in match.groups()])
    with open(path, 'rb') as stream:
        digest = hashlib.sha256(stream.read()).hexdigest()
    reports.append(dict(id=path.split('/')[-1].removesuffix('.pdf'), sha256=digest, cover=texts[0][:1300], planes=planes, bands=bands, stationNames=sorted(set(names)), parsedStationRows=len(names), frequencyGroupCount=len(groups), frequencyGroupSample=groups[:5], groupDateVariants=sorted({tuple([g[0]] + g[2:]) for g in groups}), totals=totals))
print(json.dumps(reports))
