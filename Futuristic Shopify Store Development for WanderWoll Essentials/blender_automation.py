/**
 * WanderWoll essentials - Blender Automation Script
 * 
 * This script provides automation for Blender to process 3D models
 * for the WanderWoll essentials Shopify store.
 */

import bpy
import os
import sys
import json
import argparse
import math
from mathutils import Vector

class WanderWollBlenderAutomation:
    """
    Automation class for processing 3D models for WanderWoll essentials
    """
    
    def __init__(self, input_file=None, output_file=None, color_hex=None, mode='render'):
        """Initialize the automation with input parameters"""
        self.input_file = input_file
        self.output_file = output_file
        self.color_hex = color_hex or '#2E8B57'  # Default to Forest Green
        self.mode = mode
        
        # Brand colors
        self.colors = {
            'forest-green': (46/255, 139/255, 87/255),
            'beige': (245/255, 222/255, 179/255),
            'black': (0, 0, 0)
        }
    
    def setup_environment(self):
        """Set up the Blender environment for automation"""
        # Clear default scene
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # Set up rendering engine
        bpy.context.scene.render.engine = 'CYCLES'
        
        # Try to use GPU if available
        if bpy.context.preferences.addons.get('cycles'):
            cycles_prefs = bpy.context.preferences.addons['cycles'].preferences
            if hasattr(cycles_prefs, 'compute_device_type'):
                cycles_prefs.compute_device_type = 'CUDA'
                for device in cycles_prefs.devices:
                    device.use = True
        
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
    
    def import_model(self):
        """Import a 3D model based on file extension"""
        if not self.input_file or not os.path.exists(self.input_file):
            raise ValueError(f"Input file not found: {self.input_file}")
        
        ext = os.path.splitext(self.input_file)[1].lower()
        
        if ext == '.obj':
            bpy.ops.import_scene.obj(filepath=self.input_file)
        elif ext == '.fbx':
            bpy.ops.import_scene.fbx(filepath=self.input_file)
        elif ext == '.glb' or ext == '.gltf':
            bpy.ops.import_scene.gltf(filepath=self.input_file)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
        
        # Return the imported objects
        return bpy.context.selected_objects
    
    def setup_camera(self):
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
    
    def setup_lighting(self):
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
    
    def hex_to_rgb(self, hex_color):
        """Convert hex color to RGB values"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4))
    
    def apply_material(self, obj):
        """Apply a material with the specified color"""
        # Convert hex color to RGB if provided
        if self.color_hex.startswith('#'):
            rgb = self.hex_to_rgb(self.color_hex)
        else:
            # Use predefined color if available
            rgb = self.colors.get(self.color_hex.lower(), (0.5, 0.5, 0.5))
        
        # Create new material
        mat_name = f"Material_{self.color_hex.replace('#', '')}"
        mat = bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True
        
        # Get material nodes
        nodes = mat.node_tree.nodes
        bsdf = nodes.get('Principled BSDF')
        
        # Set color
        bsdf.inputs['Base Color'].default_value = (*rgb, 1)
        
        # Set material properties for fabric
        bsdf.inputs['Roughness'].default_value = 0.8
        bsdf.inputs['Specular'].default_value = 0.1
        
        # Assign material to object
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)
        
        return mat
    
    def setup_cloth_simulation(self, obj, quality='medium'):
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
    
    def add_wind_force(self):
        """Add wind force field for realistic movement"""
        bpy.ops.object.effector_add(type='WIND', location=(0, -2, 1))
        wind = bpy.context.object
        wind.name = 'Wind'
        wind.field.strength = 5
        wind.field.flow = 1
        wind.field.noise = 0.5
        
        return wind
    
    def add_collision_object(self):
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
    
    def bake_cloth_simulation(self, frames=50):
        """Bake the cloth simulation"""
        # Set frame range
        bpy.context.scene.frame_start = 1
        bpy.context.scene.frame_end = frames
        
        # Bake simulation
        bpy.ops.ptcache.bake_all(bake=True)
        
        # Go to last frame to show final result
        bpy.context.scene.frame_set(frames)
    
    def apply_simulation(self):
        """Apply the simulation to make it permanent"""
        obj = bpy.context.object
        bpy.ops.object.modifier_apply(modifier="Cloth")
        
        return obj
    
    def render_product(self):
        """Render the product and save to output path"""
        if not self.output_file:
            raise ValueError("Output file path is required for rendering")
        
        # Set output path
        bpy.context.scene.render.filepath = self.output_file
        
        # Render
        bpy.ops.render.render(write_still=True)
        
        return self.output_file
    
    def process_model(self):
        """Process the model based on the specified mode"""
        # Set up environment
        self.setup_environment()
        
        # Import model
        objects = self.import_model()
        
        # Process based on mode
        if self.mode == 'render':
            # Set up camera and lighting
            self.setup_camera()
            self.setup_lighting()
            
            # Apply material
            for obj in objects:
                if obj.type == 'MESH':
                    self.apply_material(obj)
            
            # Render
            self.render_product()
            print(f"Rendered {self.input_file} to {self.output_file}")
            
        elif self.mode == 'convert':
            # Export as GLB
            bpy.ops.export_scene.gltf(
                filepath=self.output_file,
                export_format='GLB',
                export_textures=True,
                export_draco_mesh_compression_enable=True
            )
            print(f"Converted {self.input_file} to {self.output_file}")
            
        elif self.mode == 'simulate':
            # Get the first mesh object
            mesh_obj = None
            for obj in objects:
                if obj.type == 'MESH':
                    mesh_obj = obj
                    break
            
            if not mesh_obj:
                raise ValueError("No mesh object found in the imported file")
            
            # Add collision object
            mannequin = self.add_collision_object()
            
            # Set up cloth simulation
            cloth = self.setup_cloth_simulation(mesh_obj, 'medium')
            
            # Add wind force
            wind = self.add_wind_force()
            
            # Bake simulation
            self.bake_cloth_simulation(50)
            
            # Apply simulation
            self.apply_simulation()
            
            # Delete helpers
            bpy.data.objects.remove(mannequin)
            bpy.data.objects.remove(wind)
            
            # Export result
            bpy.ops.export_scene.gltf(
                filepath=self.output_file,
                export_format='GLB',
                export_textures=True,
                export_draco_mesh_compression_enable=True
            )
            print(f"Simulated and exported {self.input_file} to {self.output_file}")
        
        else:
            raise ValueError(f"Unsupported mode: {self.mode}")

def main():
    # Parse arguments
    parser = argparse.ArgumentParser(description='WanderWoll Blender Automation Script')
    parser.add_argument('--input', required=True, help='Input model file path')
    parser.add_argument('--output', required=True, help='Output file path')
    parser.add_argument('--color', default='#2E8B57', help='Color in hex format or named color')
    parser.add_argument('--mode', default='render', choices=['render', 'convert', 'simulate'], 
                        help='Processing mode')
    
    # Get arguments after --
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    args = parser.parse_args(argv)
    
    # Create automation instance
    automation = WanderWollBlenderAutomation(
        input_file=args.input,
        output_file=args.output,
        color_hex=args.color,
        mode=args.mode
    )
    
    # Process model
    automation.process_model()
    
    print("Processing complete")

if __name__ == "__main__":
    main()
