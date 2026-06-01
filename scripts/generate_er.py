#!/usr/bin/env python3
"""
Generate an ER diagram (PNG) from Django models.

Usage:
  python scripts/generate_er.py --output er_diagram

Produces `er_diagram.png` in the current working directory.

Requirements:
  pip install graphviz
  System Graphviz (dot) must be installed and available in PATH.

The script imports Django settings from the project; when executed from
repository root it will auto-add the Django project path so that
`backend.settings` can be imported.
"""
import os
import sys
import argparse

try:
    from graphviz import Digraph
except Exception:
    print('graphviz Python package is required. Install with: pip install graphviz')
    raise


def setup_django():
    # Ensure Django project is importable (project module is `backend`)
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    django_project_path = os.path.join(repo_root, 'backend')
    if django_project_path not in sys.path:
        sys.path.insert(0, django_project_path)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        import django
        django.setup()
    except Exception as exc:
        print('Failed to setup Django. Check DJANGO_SETTINGS_MODULE and PYTHONPATH.', exc)
        raise


def model_label(model):
    # Build a simple record-style label for the node: ModelName | fields
    fields = []
    for f in model._meta.get_fields():
        # Skip reverse relations for compactness
        if f.auto_created and not getattr(f, 'concrete', False):
            continue
        name = f.name
        t = type(f).__name__
        suffix = ''
        if getattr(f, 'primary_key', False):
            suffix = ' PK'
        if getattr(f, 'unique', False) and not getattr(f, 'primary_key', False):
            suffix += ' UQ'
        fields.append(f'{name}: {t}{suffix}')
    # Use record label
    label = '{%s|%s}' % (model.__name__, '\l'.join(fields) + '\l')
    return label


def build_er(output_basename='er_diagram'):
    from django.apps import apps

    models = list(apps.get_models())
    dot = Digraph(comment='ER diagram', format='png')
    dot.attr('node', shape='record', fontsize='10')

    name_map = {m: m.__name__ for m in models}

    # Create nodes
    for m in models:
        dot.node(m.__name__, label=model_label(m))

    # Create edges for FK/OneToOne/M2M
    for m in models:
        for f in m._meta.get_fields():
            # ForeignKey and OneToOne
            if getattr(f, 'is_relation', False) and getattr(f, 'related_model', None):
                if f.auto_created and not getattr(f, 'concrete', False):
                    continue
                rel = f.related_model
                if rel is None:
                    continue
                # Avoid self-relation duplication
                edge_label = f.name
                dot.edge(m.__name__, rel.__name__, label=edge_label)

    outpath = dot.render(filename=output_basename, cleanup=True)
    print(f'ER diagram saved to: {outpath}')


def main():
    parser = argparse.ArgumentParser(description='Generate ER diagram from Django models')
    parser.add_argument('--output', '-o', default='er_diagram', help='Base name for output file (without extension)')
    args = parser.parse_args()

    setup_django()
    build_er(output_basename=args.output)


if __name__ == '__main__':
    main()
