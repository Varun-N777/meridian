import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'omnipulse.db')
if os.path.exists(db_path):
    os.remove(db_path)
    print("Deleted omnipulse.db")

import comprehensive_loader
comprehensive_loader.main()
