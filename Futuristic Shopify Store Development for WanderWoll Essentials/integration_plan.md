# Blender Automation Integration Plan

## Overview

This document outlines the strategy for using Blender's Python API to automate 3D model processing for the WanderWoll essentials Shopify store. Blender automation will enable batch processing of models, cloth simulation for realistic draping, and automated rendering for product images.

## Blender Python API Setup

### Installation Requirements

```bash
# Install required Python packages
pip install bpy numpy pillow requests

# Create directory structure
mkdir -p scripts/cloth_simulation
mkdir -p scripts/batch_processing
mkdir -p scripts/rendering
mkdir -p output/models
mkdir -p output/renders
```

### Basic Blender Automation Script

```python
# blender_automation.py
import bpy
import os
import sys
import argparse

def setup_environment():
    """Set up the Blender environment for automation"""
    # Clear default scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Set up rendering engine
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.device = 'GPU'
    
    # Set up output settings
    bpy.context.scene.render.resolution_x = 2048
    bpy.context.scene.render.resolution_y = 2048
    bpy.context.scene.render.resolution_percentage = 100
    bpy.context.scene.render.film_transparent = True
    
    # Set up world settings
    world = bpy.data.worlds['World']
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs[0].default_value = (1, 1, 1, 1)  # White background
    bg.inputs[1].default_value = 1.0  # Strength

def import_model(file_path):
    """Import a 3D model based on file extension"""
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == '.obj':
        bpy.ops.import_scene.obj(filepath=file_path)
    elif ext == '.fbx':
        bpy.ops.import_scene.fbx(filepath=file_path)
    elif ext == '.glb' or ext == '.gltf':
        bpy.ops.import_scene.gltf(filepath=file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")
    
    # Return the imported objects
    return bpy.context.selected_objects

def setup_camera():
    """Set up camera for product rendering"""
    # Create camera if it doesn't exist
    if 'Camera' not in bpy.data.objects:
        bpy.ops.object.camera_add()
        camera = bpy.data.objects['Camera']
    else:
        camera = bpy.data.objects['Camera']
    
    # Position camera
    camera.location = (0, -3, 1.2)
    camera.rotation_euler = (1.5, 0, 0)
    
    # Set camera as active
    bpy.context.scene.camera = camera
    
    return camera

def setup_lighting():
    """Set up three-point lighting for product rendering"""
    # Create key light
    bpy.ops.object.light_add(type='AREA', location=(2, -2, 2))
    key_light = bpy.context.object
    key_light.name = 'Key_Light'
    key_light.data.energy = 500
    key_light.data.size = 2
    
    # Create fill light
    bpy.ops.object.light_add(type='AREA', location=(-2, -2, 1))
    fill_light = bpy.context.object
    fill_light.name = 'Fill_Light'
    fill_light.data.energy = 200
    fill_light.data.size = 3
    
    # Create back light
    bpy.ops.object.light_add(type='AREA', location=(0, 2, 3))
    back_light = bpy.context.object
    back_light.name = 'Back_Light'
    back_light.data.energy = 300
    back_light.data.size = 2
    
    return [key_light, fill_light, back_light]

def apply_material(obj, color_hex):
    """Apply a simple material with the specified color"""
    # Convert hex color to RGB
    if color_hex.startswith('#'):
        r = int(color_hex[1:3], 16) / 255
        g = int(color_hex[3:5], 16) / 255
        b = int(color_hex[5:7], 16) / 255
    else:
        r, g, b = 0.5, 0.5, 0.5  # Default gray
    
    # Create new material
    mat_name = f"Material_{color_hex.replace('#', '')}"
    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    
    # Get material nodes
    nodes = mat.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    
    # Set color
    bsdf.inputs['Base Color'].default_value = (r, g, b, 1)
    
    # Set material properties for fabric
    bsdf.inputs['Roughness'].default_value = 0.8
    bsdf.inputs['Specular'].default_value = 0.1
    
    # Assign material to object
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    
    return mat

def render_product(output_path):
    """Render the product and save to output path"""
    # Set output path
    bpy.context.scene.render.filepath = output_path
    
    # Render
    bpy.ops.render.render(write_still=True)
    
    return output_path

def main():
    # Parse arguments
    parser = argparse.ArgumentParser(description='Blender Automation Script')
    parser.add_argument('--input', required=True, help='Input model file path')
    parser.add_argument('--output', required=True, help='Output file path')
    parser.add_argument('--color', default='#2E8B57', help='Color in hex format')
    parser.add_argument('--mode', default='render', choices=['render', 'convert', 'simulate'], 
                        help='Processing mode')
    
    # Get arguments after --
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    args = parser.parse_args(argv)
    
    # Set up environment
    setup_environment()
    
    # Import model
    objects = import_model(args.input)
    
    # Process based on mode
    if args.mode == 'render':
        # Set up camera and lighting
        setup_camera()
        setup_lighting()
        
        # Apply material
        for obj in objects:
            if obj.type == 'MESH':
                apply_material(obj, args.color)
        
        # Render
        render_product(args.output)
        print(f"Rendered {args.input} to {args.output}")
        
    elif args.mode == 'convert':
        # Export as GLB
        bpy.ops.export_scene.gltf(
            filepath=args.output,
            export_format='GLB',
            export_textures=True,
            export_draco_mesh_compression_enable=True
        )
        print(f"Converted {args.input} to {args.output}")
        
    elif args.mode == 'simulate':
        # Apply cloth simulation (to be implemented)
        print("Cloth simulation not yet implemented")
    
    print("Processing complete")

if __name__ == "__main__":
    main()
```

## Cloth Simulation Implementation

```python
# cloth_simulation.py
import bpy
import os
import sys
import argparse

def setup_cloth_simulation(obj, quality='medium'):
    """Set up cloth simulation for an object"""
    # Make sure object is selected and active
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    
    # Add cloth modifier
    bpy.ops.object.modifier_add(type='CLOTH')
    cloth = obj.modifiers['Cloth']
    
    # Configure cloth settings based on quality
    if quality == 'low':
        cloth.settings.quality = 5
    elif quality == 'medium':
        cloth.settings.quality = 10
    elif quality == 'high':
        cloth.settings.quality = 15
    
    # Configure cloth material
    cloth.settings.tension_stiffness = 15
    cloth.settings.compression_stiffness = 15
    cloth.settings.shear_stiffness = 5
    cloth.settings.bending_stiffness = 5
    
    # Configure cloth damping
    cloth.settings.tension_damping = 5
    cloth.settings.compression_damping = 5
    cloth.settings.shear_damping = 5
    cloth.settings.bending_damping = 5
    
    return cloth

def add_wind_force():
    """Add wind force field for realistic movement"""
    bpy.ops.object.effector_add(type='WIND', location=(0, -2, 1))
    wind = bpy.context.object
    wind.name = 'Wind'
    wind.field.strength = 5
    wind.field.flow = 1
    wind.field.noise = 0.5
    
    return wind

def add_collision_object():
    """Add invisible collision object for realistic draping"""
    # Create mannequin or simplified human form
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.4,
        depth=1.8,
        location=(0, 0, 0)
    )
    mannequin = bpy.context.object
    mannequin.name = 'Mannequin'
    
    # Add collision modifier
    bpy.ops.object.modifier_add(type='COLLISION')
    
    # Make invisible in render
    mannequin.hide_render = True
    
    return mannequin

def bake_cloth_simulation(frames=50):
    """Bake the cloth simulation"""
    # Set frame range
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = frames
    
    # Bake simulation
    bpy.ops.ptcache.bake_all(bake=True)
    
    # Go to last frame to show final result
    bpy.context.scene.frame_set(frames)

def apply_simulation():
    """Apply the simulation to make it permanent"""
    obj = bpy.context.object
    bpy.ops.object.modifier_apply(modifier="Cloth")
    
    return obj

def main():
    # Parse arguments
    parser = argparse.ArgumentParser(description='Cloth Simulation Script')
    parser.add_argument('--input', required=True, help='Input model file path')
    parser.add_argument('--output', required=True, help='Output file path')
    parser.add_argument('--quality', default='medium', choices=['low', 'medium', 'high'], 
                        help='Simulation quality')
    parser.add_argument('--frames', type=int, default=50, help='Number of simulation frames')
    
    # Get arguments after --
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    args = parser.parse_args(argv)
    
    # Import model
    bpy.ops.import_scene.obj(filepath=args.input)
    obj = bpy.context.selected_objects[0]
    
    # Add collision object
    mannequin = add_collision_object()
    
    # Set up cloth simulation
    cloth = setup_cloth_simulation(obj, args.quality)
    
    # Add wind force
    wind = add_wind_force()
    
    # Bake simulation
    bake_cloth_simulation(args.frames)
    
    # Apply simulation
    apply_simulation()
    
    # Delete helpers
    bpy.data.objects.remove(mannequin)
    bpy.data.objects.remove(wind)
    
    # Export result
    bpy.ops.export_scene.obj(filepath=args.output)
    
    print(f"Cloth simulation completed and saved to {args.output}")

if __name__ == "__main__":
    main()
```

## Batch Processing Implementation

```python
# batch_processor.py
import os
import subprocess
import json
import argparse
from concurrent.futures import ThreadPoolExecutor

def process_model(blender_path, script_path, input_file, output_file, color, mode):
    """Process a single model with Blender"""
    cmd = [
        blender_path,
        '--background',
        '--python', script_path,
        '--',
        '--input', input_file,
        '--output', output_file,
        '--color', color,
        '--mode', mode
    ]
    
    print(f"Processing {input_file}...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error processing {input_file}:")
        print(result.stderr)
        return False
    
    print(f"Successfully processed {input_file} to {output_file}")
    return True

def batch_process_models(config_file, max_workers=4):
    """Process multiple models in parallel"""
    # Load configuration
    with open(config_file, 'r') as f:
        config = json.load(f)
    
    blender_path = config.get('blender_path', 'blender')
    script_path = config.get('script_path', 'blender_automation.py')
    models = config.get('models', [])
    
    # Create output directories if they don't exist
    for model in models:
        output_dir = os.path.dirname(model['output'])
        os.makedirs(output_dir, exist_ok=True)
    
    # Process models in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = []
        for model in models:
            future = executor.submit(
                process_model,
                blender_path,
                script_path,
                model['input'],
                model['output'],
                model.get('color', '#2E8B57'),
                model.get('mode', 'render')
            )
            futures.append(future)
        
        # Wait for all tasks to complete
        for future in futures:
            future.result()
    
    print(f"Batch processing complete. Processed {len(models)} models.")

def main():
    parser = argparse.ArgumentParser(description='Batch Process 3D Models')
    parser.add_argument('--config', required=True, help='Configuration JSON file')
    parser.add_argument('--workers', type=int, default=4, help='Number of parallel workers')
    
    args = parser.parse_args()
    batch_process_models(args.config, args.workers)

if __name__ == "__main__":
    main()
```

## Automated Rendering Pipeline

```python
# render_pipeline.py
import os
import json
import argparse
import subprocess
from concurrent.futures import ThreadPoolExecutor

def render_product_views(blender_path, model_path, output_dir, color, views):
    """Render multiple views of a product"""
    os.makedirs(output_dir, exist_ok=True)
    
    results = []
    for view in views:
        view_name = view['name']
        camera_pos = view['camera_position']
        
        # Create temporary script for this view
        script_content = f"""
import bpy

# Set up scene
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.device = 'GPU'
bpy.context.scene.render.resolution_x = 2048
bpy.context.scene.render.resolution_y = 2048
bpy.context.scene.render.film_transparent = True

# Import model
bpy.ops.import_scene.gltf(filepath='{model_path}')

# Set up camera
bpy.ops.object.camera_add()
camera = bpy.context.object
camera.location = {camera_pos}
camera.rotation_euler = ({view.get('camera_rotation', [1.5, 0, 0])})
bpy.context.scene.camera = camera

# Set up lighting
bpy.ops.object.light_add(type='AREA', location=(2, -2, 2))
key_light = bpy.context.object
key_light.data.energy = 500

bpy.ops.object.light_add(type='AREA', location=(-2, -2, 1))
fill_light = bpy.context.object
fill_light.data.energy = 200

bpy.ops.object.light_add(type='AREA', location=(0, 2, 3))
back_light = bpy.context.object
back_light.data.energy = 300

# Apply material if needed
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        mat = bpy.data.materials.new(name="ProductMaterial")
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        bsdf = nodes.get('Principled BSDF')
        
        # Convert hex color to RGB
        color = '{color}'
        if color.startswith('#'):
            r = int(color[1:3], 16) / 255
            g = int(color[3:5], 16) / 255
            b = int(color[5:7], 16) / 255
        else:
            r, g, b = 0.5, 0.5, 0.5
        
        bsdf.inputs['Base Color'].default_value = (r, g, b, 1)
        bsdf.inputs['Roughness'].default_value = 0.8
        
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)

# Render
bpy.context.scene.render.filepath = '{os.path.join(output_dir, view_name)}'
bpy.ops.render.render(write_still=True)
"""
        
        # Write script to temporary file
        script_path = os.path.join(output_dir, f"render_{view_name}.py")
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        # Run Blender with script
        cmd = [
            blender_path,
            '--background',
            '--python', script_path
        ]
        
        print(f"Rendering {view_name} view...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Error rendering {view_name} view:")
            print(result.stderr)
            results.append({
                'view': view_name,
                'success': False,
                'error': result.stderr
            })
        else:
            results.append({
                'view': view_name,
                'success': True,
                'output_path': os.path.join(output_dir, f"{view_name}.png")
            })
    
    return results

def batch_render_products(config_file, max_workers=4):
    """Render multiple products in parallel"""
    # Load configuration
    with open(config_file, 'r') as f:
        config = json.load(f)
    
    blender_path = config.get('blender_path', 'blender')
    products = config.get('products', [])
    
    # Standard views if not specified
    standard_views = [
        {
            'name': 'front',
            'camera_position': [0, -3, 1.2],
            'camera_rotation': [1.5, 0, 0]
        },
        {
            'name': 'back',
            'camera_position': [0, 3, 1.2],
            'camera_rotation': [1.5, 3.14, 0]
        },
        {
            'name': 'side',
            'camera_position': [3, 0, 1.2],
            'camera_rotation': [1.5, 0, 1.57]
        }
    ]
    
    # Process products in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = []
        for product in products:
            model_path = product['model_path']
            output_dir = product['output_dir']
            color = product.get('color', '#2E8B57')
            views = product.get('views', standard_views)
            
            future = executor.submit(
                render_product_views,
                blender_path,
                model_path,
                output_dir,
                color,
                views
            )
            futures.append(future)
        
        # Wait for all tasks to complete and collect results
        all_results = []
        for future in futures:
            all_results.extend(future.result())
    
    # Save results to JSON
    results_path = os.path.join(os.path.dirname(config_file), 'render_results.json')
    with open(results_path, 'w') as f:
        json.dump(all_results, f, indent=2)
    
    print(f"Batch rendering complete. Results saved to {results_path}")

def main():
    parser = argparse.ArgumentParser(description='Automated Rendering Pipeline')
    parser.add_argument('--config', required=True, help='Configuration JSON file')
    parser.add_argument('--workers', type=int, default=4, help='Number of parallel workers')
    
    args = parser.parse_args()
    batch_render_products(args.config, args.workers)

if __name__ == "__main__":
    main()
```

## Shopify Integration

### 1. Automated Asset Pipeline

We'll create a script to automate the entire process from CGTrader models to Shopify-ready assets:

```python
# asset_pipeline.py
import os
import json
import argparse
import subprocess
import shutil

def process_asset(config):
    """Process a single asset through the entire pipeline"""
    asset_name = config['name']
    source_path = config['source_path']
    output_dir = config['output_dir']
    colors = config.get('colors', [{'name': 'default', 'hex': '#2E8B57'}])
    
    print(f"Processing asset: {asset_name}")
    
    # Create output directories
    os.makedirs(output_dir, exist_ok=True)
    model_dir = os.path.join(output_dir, 'models')
    render_dir = os.path.join(output_dir, 'renders')
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(render_dir, exist_ok=True)
    
    # Step 1: Convert to glTF
    print("Step 1: Converting to glTF format...")
    gltf_path = os.path.join(model_dir, f"{asset_name}.glb")
    convert_cmd = [
        config['blender_path'],
        '--background',
        '--python', config['convert_script'],
        '--',
        '--input', source_path,
        '--output', gltf_path,
        '--mode', 'convert'
    ]
    
    result = subprocess.run(convert_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error converting model: {result.stderr}")
        return False
    
    # Step 2: Apply cloth simulation if enabled
    if config.get('apply_simulation', False):
        print("Step 2: Applying cloth simulation...")
        sim_output = os.path.join(model_dir, f"{asset_name}_simulated.obj")
        sim_cmd = [
            config['blender_path'],
            '--background',
            '--python', config['simulation_script'],
            '--',
            '--input', gltf_path,
            '--output', sim_output,
            '--quality', config.get('simulation_quality', 'medium'),
            '--frames', str(config.get('simulation_frames', 50))
        ]
        
        result = subprocess.run(sim_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error in cloth simulation: {result.stderr}")
            # Continue with original model if simulation fails
        else:
            # Convert simulated model back to glTF
            gltf_path = os.path.join(model_dir, f"{asset_name}_simulated.glb")
            convert_cmd = [
                config['blender_path'],
                '--background',
                '--python', config['convert_script'],
                '--',
                '--input', sim_output,
                '--output', gltf_path,
                '--mode', 'convert'
            ]
            
            result = subprocess.run(convert_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"Error converting simulated model: {result.stderr}")
                # Revert to original model
                gltf_path = os.path.join(model_dir, f"{asset_name}.glb")
    
    # Step 3: Generate color variants
    print("Step 3: Generating color variants...")
    color_variants = {}
    
    for color in colors:
        color_name = color['name']
        color_hex = color['hex']
        
        # Create color variant
        variant_path = os.path.join(model_dir, f"{asset_name}_{color_name}.glb")
        
        # Copy base model for each variant
        shutil.copy(gltf_path, variant_path)
        
        # Add to color variants
        color_variants[color_name] = {
            'model_path': variant_path,
            'color_hex': color_hex
        }
    
    # Step 4: Render product images
    print("Step 4: Rendering product images...")
    for color_name, variant in color_variants.items():
        variant_render_dir = os.path.join(render_dir, color_name)
        os.makedirs(variant_render_dir, exist_ok=True)
        
        # Standard views
        views = [
            {
                'name': 'front',
                'camera_position': [0, -3, 1.2],
                'camera_rotation': [1.5, 0, 0]
            },
            {
                'name': 'back',
                'camera_position': [0, 3, 1.2],
                'camera_rotation': [1.5, 3.14, 0]
            },
            {
                'name': 'side',
                'camera_position': [3, 0, 1.2],
                'camera_rotation': [1.5, 0, 1.57]
            }
        ]
        
        # Render each view
        for view in views:
            view_name = view['name']
            output_path = os.path.join(variant_render_dir, f"{view_name}.png")
            
            render_cmd = [
                config['blender_path'],
                '--background',
                '--python', config['render_script'],
                '--',
                '--input', variant['model_path'],
                '--output', output_path,
                '--color', variant['color_hex'],
                '--mode', 'render'
            ]
            
            result = subprocess.run(render_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"Error rendering {view_name} view for {color_name}: {result.stderr}")
    
    # Step 5: Generate metadata
    print("Step 5: Generating metadata...")
    metadata = {
        'name': asset_name,
        'source': source_path,
        'colors': colors,
        'models': {
            color_name: {
                'path': os.path.relpath(variant['model_path'], output_dir),
                'color': variant['color_hex']
            } for color_name, variant in color_variants.items()
        },
        'renders': {
            color_name: {
                'directory': os.path.relpath(os.path.join(render_dir, color_name), output_dir),
                'views': [f"{view['name']}.png" for view in views]
            } for color_name in color_variants.keys()
        }
    }
    
    # Write metadata
    metadata_path = os.path.join(output_dir, f"{asset_name}_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Asset processing complete: {asset_name}")
    return True

def main():
    parser = argparse.ArgumentParser(description='Asset Pipeline')
    parser.add_argument('--config', required=True, help='Configuration JSON file')
    
    args = parser.parse_args()
    
    # Load configuration
    with open(args.config, 'r') as f:
        config = json.load(f)
    
    # Process each asset
    for asset_config in config['assets']:
        process_asset({**config['global'], **asset_config})
    
    print("Asset pipeline complete")

if __name__ == "__main__":
    main()
```

### 2. Shopify Asset Upload

We'll create a script to upload the processed assets to Shopify:

```python
# shopify_uploader.py
import os
import json
import argparse
import requests
import base64

def upload_to_shopify(config):
    """Upload processed assets to Shopify"""
    # Shopify API credentials
    shop_url = config['shop_url']
    api_key = config['api_key']
    password = config['password']
    api_version = config.get('api_version', '2023-01')
    
    # Base API URL
    base_url = f"https://{api_key}:{password}@{shop_url}/admin/api/{api_version}"
    
    # Headers
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    # Process each asset
    for asset_dir in config['asset_directories']:
        # Load metadata
        metadata_files = [f for f in os.listdir(asset_dir) if f.endswith('_metadata.json')]
        
        if not metadata_files:
            print(f"No metadata found in {asset_dir}")
            continue
        
        metadata_path = os.path.join(asset_dir, metadata_files[0])
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        asset_name = metadata['name']
        print(f"Uploading asset: {asset_name}")
        
        # Find or create product
        product_data = {
            'product': {
                'title': asset_name,
                'product_type': config.get('product_type', 'Apparel'),
                'vendor': config.get('vendor', 'WanderWoll essentials'),
                'tags': config.get('tags', 'merino, 3d-model'),
                'variants': []
            }
        }
        
        # Add variants for each color
        for color_name, color_info in metadata['models'].items():
            product_data['product']['variants'].append({
                'title': color_name,
                'option1': color_name,
                'price': config.get('price', '69.95'),
                'inventory_management': 'shopify',
                'inventory_policy': 'continue',
                'inventory_quantity': 100
            })
        
        # Create product
        response = requests.post(
            f"{base_url}/products.json",
            headers=headers,
            json=product_data
        )
        
        if response.status_code != 201:
            print(f"Error creating product: {response.text}")
            continue
        
        product = response.json()['product']
        product_id = product['id']
        
        print(f"Created product with ID: {product_id}")
        
        # Upload 3D models
        for color_name, model_info in metadata['models'].items():
            model_path = os.path.join(asset_dir, model_info['path'])
            
            # Read model file
            with open(model_path, 'rb') as f:
                model_data = f.read()
            
            # Encode as base64
            model_base64 = base64.b64encode(model_data).decode('utf-8')
            
            # Upload as asset
            asset_data = {
                'asset': {
                    'key': f"assets/{asset_name}_{color_name}.glb",
                    'attachment': model_base64,
                    'content_type': 'model/gltf-binary'
                }
            }
            
            response = requests.post(
                f"{base_url}/themes/{config['theme_id']}/assets.json",
                headers=headers,
                json=asset_data
            )
            
            if response.status_code != 201:
                print(f"Error uploading 3D model for {color_name}: {response.text}")
                continue
            
            asset = response.json()['asset']
            
            # Update product metafield with model URL
            metafield_data = {
                'metafield': {
                    'namespace': 'wanderwoll',
                    'key': f"model_url_{color_name}",
                    'value': asset['public_url'],
                    'type': 'single_line_text_field'
                }
            }
            
            response = requests.post(
                f"{base_url}/products/{product_id}/metafields.json",
                headers=headers,
                json=metafield_data
            )
            
            if response.status_code != 201:
                print(f"Error setting metafield for {color_name}: {response.text}")
        
        # Upload product images
        for color_name, render_info in metadata['renders'].items():
            render_dir = os.path.join(asset_dir, render_info['directory'])
            
            for view_file in render_info['views']:
                image_path = os.path.join(render_dir, view_file)
                
                # Read image file
                with open(image_path, 'rb') as f:
                    image_data = f.read()
                
                # Encode as base64
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                
                # Upload as product image
                image_data = {
                    'image': {
                        'product_id': product_id,
                        'attachment': image_base64,
                        'filename': f"{asset_name}_{color_name}_{view_file}",
                        'alt': f"{asset_name} {color_name} {view_file.split('.')[0]} view"
                    }
                }
                
                response = requests.post(
                    f"{base_url}/products/{product_id}/images.json",
                    headers=headers,
                    json=image_data
                )
                
                if response.status_code != 201:
                    print(f"Error uploading image {view_file} for {color_name}: {response.text}")
        
        print(f"Successfully uploaded asset: {asset_name}")
    
    print("Upload complete")

def main():
    parser = argparse.ArgumentParser(description='Shopify Asset Uploader')
    parser.add_argument('--config', required=True, help='Configuration JSON file')
    
    args = parser.parse_args()
    
    # Load configuration
    with open(args.config, 'r') as f:
        config = json.load(f)
    
    # Upload assets
    upload_to_shopify(config)

if __name__ == "__main__":
    main()
```

## Implementation Steps

1. **Environment Setup**
   - Install Blender (open-source)
   - Set up Python environment with required packages
   - Create directory structure for scripts and outputs

2. **Basic Automation Scripts**
   - Implement model conversion script
   - Set up rendering pipeline
   - Create cloth simulation functionality

3. **Batch Processing System**
   - Implement parallel processing for efficiency
   - Create configuration-based workflow
   - Set up logging and error handling

4. **Shopify Integration**
   - Create asset pipeline for end-to-end processing
   - Implement Shopify upload functionality
   - Set up metafield configuration

5. **Testing and Optimization**
   - Test with sample models from CGTrader
   - Optimize for performance and quality
   - Create documentation for usage

## Next Steps

1. Install Blender and set up Python environment
2. Implement basic automation scripts
3. Test with sample models from CGTrader
4. Create end-to-end asset pipeline
5. Integrate with Shopify theme
