import os
import re

directory = r'c:\Users\yuvas\Desktop\AI food\AgriFlux\Frontend\src\pages'

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    # Update the main header flex container
    content = content.replace(
        'className="flex flex-col md:flex-row md:items-center justify-between gap-4"',
        'className="flex flex-col items-center md:flex-row md:items-start justify-between gap-4 text-center md:text-left"'
    )
    
    # Another variation
    content = content.replace(
        'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"',
        'className="flex flex-col items-center md:flex-row md:items-start justify-between gap-4 text-center md:text-left"'
    )

    # Update the badges/buttons flex container right after the header
    content = content.replace(
        'className="flex items-center gap-2"',
        'className="flex items-center justify-center md:justify-start gap-2"'
    )
    
    content = content.replace(
        'className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1',
        'className="flex items-center justify-center md:justify-start gap-1 bg-gray-100 dark:bg-gray-800 p-1'
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")

for filename in os.listdir(directory):
    if filename.endswith('.tsx'):
        filepath = os.path.join(directory, filename)
        replace_in_file(filepath)

# Update AuthLayout
auth_path = r'c:\Users\yuvas\Desktop\AI food\AgriFlux\Frontend\src\layouts\AuthLayout.tsx'
with open(auth_path, 'r', encoding='utf-8') as f:
    auth_content = f.read()

if 'min-h-[720px]' in auth_content and 'lg:min-h-[720px]' not in auth_content:
    auth_content = auth_content.replace('min-h-[720px]', 'min-h-[600px] lg:min-h-[720px]')
    with open(auth_path, 'w', encoding='utf-8') as f:
        f.write(auth_content)
    print("Updated AuthLayout.tsx")

print("Done.")
