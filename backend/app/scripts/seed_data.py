from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.core.security import get_password_hash
from backend.app.models.models import (
    User, UserRole, Doctor, Therapist, TreatmentRoom, Therapy,
    Patient, Appointment, AppointmentStatus, TreatmentPlan,
    TreatmentSession, Prescription, PrescriptionItem, DietPlan,
    Invoice, InvoiceItem, InventoryItem, InventoryTransaction, Notification
)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # If users exist, already seeded
    if db.query(User).count() > 0:
        db.close()
        return

    print("Seeding AyurSutra demonstration data...")

    # 1. Users
    pwd_hash = get_password_hash("Password123!")
    
    admin_user = User(
        email="admin@ayursutra.hospital",
        hashed_password=pwd_hash,
        full_name="Dr. K. S. Varma",
        role=UserRole.ADMIN.value,
        phone="+91 98470 11223"
    )
    doctor_user = User(
        email="doctor@ayursutra.hospital",
        hashed_password=pwd_hash,
        full_name="Dr. Rajesh Krishnan",
        role=UserRole.DOCTOR.value,
        phone="+91 98470 22334"
    )
    therapist_user = User(
        email="therapist@ayursutra.hospital",
        hashed_password=pwd_hash,
        full_name="Suresh Nair",
        role=UserRole.THERAPIST.value,
        phone="+91 98470 33445"
    )
    reception_user = User(
        email="reception@ayursutra.hospital",
        hashed_password=pwd_hash,
        full_name="Pooja Menon",
        role=UserRole.RECEPTIONIST.value,
        phone="+91 98470 44556"
    )
    db.add_all([admin_user, doctor_user, therapist_user, reception_user])
    db.commit()

    # 2. Doctors
    doc1 = Doctor(
        user_id=doctor_user.id,
        full_name="Dr. Rajesh Krishnan",
        specialization="Panchakarma & Neurological Disorders",
        qualification="BAMS, MD (Panchakarma) - VPSV Kottakkal",
        registration_number="TRA-AYU-84920",
        email="doctor@ayursutra.hospital",
        phone="+91 98470 22334",
        experience_years=14,
        consultation_fee=600.0
    )
    doc2 = Doctor(
        full_name="Dr. Malavika Warrier",
        specialization="Kayachikitsa & Rheumatology",
        qualification="BAMS, MD (Kayachikitsa) - Govt. Ayurveda College Thiruvananthapuram",
        registration_number="TRA-AYU-91834",
        email="dr.malavika@ayursutra.hospital",
        phone="+91 98470 55667",
        experience_years=9,
        consultation_fee=500.0
    )
    db.add_all([doc1, doc2])
    db.commit()

    # 3. Therapists
    t1 = Therapist(
        user_id=therapist_user.id,
        full_name="Suresh Nair",
        qualification="Senior Certified Panchakarma Technician (Keraleeya Ayurveda)",
        phone="+91 98470 33445",
        email="therapist@ayursutra.hospital",
        supported_therapies="Abhyanga, Shirodhara, Pizhichil, Kizhi, Udvartana",
        working_hours_start="08:00",
        working_hours_end="18:00",
        is_available=True,
        experience_years=12
    )
    t2 = Therapist(
        full_name="Vinod Kumar",
        qualification="Diploma in Ayurvedic Nursing & Panchakarma",
        phone="+91 98470 66778",
        email="vinod.kumar@ayursutra.hospital",
        supported_therapies="Abhyanga, Basti, Vamana, Virechana, Nasya",
        working_hours_start="08:00",
        working_hours_end="17:00",
        is_available=True,
        experience_years=8
    )
    t3 = Therapist(
        full_name="Deepa Pillai",
        qualification="Advanced Diploma in Panchakarma Therapy",
        phone="+91 98470 77889",
        email="deepa.pillai@ayursutra.hospital",
        supported_therapies="Abhyanga, Shirodhara, Nasya, Udvartana, Mukhalepa",
        working_hours_start="09:00",
        working_hours_end="18:00",
        is_available=True,
        experience_years=7
    )
    t4 = Therapist(
        full_name="Anjali Mohan",
        qualification="Certified Ayurvedic Wellness Therapist",
        phone="+91 98470 88990",
        email="anjali.mohan@ayursutra.hospital",
        supported_therapies="Abhyanga, Shirodhara, Pizhichil, Basti",
        working_hours_start="08:30",
        working_hours_end="17:30",
        is_available=True,
        experience_years=5
    )
    db.add_all([t1, t2, t3, t4])
    db.commit()

    # 4. Treatment Rooms
    r1 = TreatmentRoom(
        room_number="101",
        name="Dhara Chamber (Dhanwanthari)",
        room_type="Dhara Suite",
        facilities="Teak Wood Droni, Bronze Dhara Vessel, Temperature-Controlled Oil Reservoir, En-suite Hot Bath"
    )
    r2 = TreatmentRoom(
        room_number="102",
        name="Abhyanga Suite (Agastya)",
        room_type="General Therapy Suite",
        facilities="Ergonomic Massage Droni, Classical Steam Box (Bashpa Sweda), Herbal Infusion Unit"
    )
    r3 = TreatmentRoom(
        room_number="103",
        name="Shodhana Hall (Charaka)",
        room_type="Panchakarma Shodhana Room",
        facilities="Specialized Vamana Basin, Basti Administration Couch, Sterilization Cabinet"
    )
    r4 = TreatmentRoom(
        room_number="104",
        name="Pizhichil & Swedana Chamber (Sushruta)",
        room_type="Therapy & Steam Chamber",
        facilities="Double-attendant Droni, Continuous Oil Circulator, Full-body Wooden Steam Cabinet"
    )
    db.add_all([r1, r2, r3, r4])
    db.commit()

    # 5. Therapies Catalog
    th1 = Therapy(
        name="Abhyanga",
        code="PAN-ABH",
        description="Classical full-body synchronized warm herbal oil massage to nourish tissues, stimulate lymph, and harmonize Vata dosha.",
        default_duration_minutes=60,
        indicative_price=1800.0,
        required_room_type="General Therapy Suite",
        required_therapist_skills="Abhyanga, Massage",
        preparation_instructions="Warm Dhanwantharam or Mahanarayana oil to 38°C. Ensure room is draft-free and warm.",
        precautions="Avoid in acute fever (Taruna Jwara), severe indigestion (Ajeerna), or immediately after meals."
    )
    th2 = Therapy(
        name="Shirodhara",
        code="PAN-SHI",
        description="Gentle, continuous rhythmic pouring of warm herbal oil (or medicated buttermilk) over the forehead (Ajna chakra) for mental clarity and insomnia.",
        default_duration_minutes=60,
        indicative_price=2500.0,
        required_room_type="Dhara Suite",
        required_therapist_skills="Shirodhara",
        preparation_instructions="Prepare Ksheerabala or Chandanadi oil. Maintain rhythmic flow 4 inches above forehead.",
        precautions="Contraindicated in head trauma, severe neck stiffness, or conjunctivitis."
    )
    th3 = Therapy(
        name="Basti (Matra & Kashaya)",
        code="PAN-BAS",
        description="Medicated herbal decoction and oil administration via rectus; recognized in classical Ayurveda as half the total Panchakarma treatment for Vata disorders.",
        default_duration_minutes=45,
        indicative_price=1600.0,
        required_room_type="Panchakarma Shodhana Room",
        required_therapist_skills="Basti",
        preparation_instructions="Prepare warmed Kashaya/Taila blend at body temperature with Saindhava lavana and honey.",
        precautions="Ensure patient is relaxed in left lateral position (Vama Parshwa). Keep post-basti monitoring."
    )
    th4 = Therapy(
        name="Virechana",
        code="PAN-VIR",
        description="Therapeutic controlled purgation following rigorous internal Snehana and Swedana for eliminating vitiated Pitta dosha.",
        default_duration_minutes=90,
        indicative_price=3200.0,
        required_room_type="Panchakarma Shodhana Room",
        required_therapist_skills="Virechana",
        preparation_instructions="Pre-medication with Trivrit Lehyam or Avipattikar Churna under clinician supervision.",
        precautions="Continuous vitals monitoring (hydration, pulse, BP). Strict Samsarjana Krama dietary protocol."
    )
    th5 = Therapy(
        name="Vamana",
        code="PAN-VAM",
        description="Therapeutic emesis procedure primarily indicated for chronic respiratory disorders, skin ailments, and severe Kapha vitiation.",
        default_duration_minutes=90,
        indicative_price=3500.0,
        required_room_type="Panchakarma Shodhana Room",
        required_therapist_skills="Vamana",
        preparation_instructions="Pre-procedure full-stomach decoction of Madanaphala and Yashtimadhu under doctor presence.",
        precautions="Mandatory doctor presence throughout procedure. Measure Vegas and vitals carefully."
    )
    th6 = Therapy(
        name="Nasya",
        code="PAN-NAS",
        description="Administration of medicated herbal oils or juices through nasal passage for disorders of head, sinus, eyes, and cervical spine.",
        default_duration_minutes=45,
        indicative_price=1200.0,
        required_room_type="General Therapy Suite",
        required_therapist_skills="Nasya",
        preparation_instructions="Perform mild facial Abhyanga and steam (Mukha Sweda) prior to instilling Anu Thailam.",
        precautions="Ensure patient does not swallow droplets immediately; gargle warm water after treatment."
    )
    th7 = Therapy(
        name="Udvartana",
        code="PAN-UDV",
        description="Deep tissue lymphatic scrubbing using warm, dry herbal powders (Kolakulathadi Churna) to metabolize subcutaneous fat and balance Kapha.",
        default_duration_minutes=60,
        indicative_price=2000.0,
        required_room_type="General Therapy Suite",
        required_therapist_skills="Udvartana",
        preparation_instructions="Warm herbal churna mixture; stroke upwards against hair follicles (Pratiloma).",
        precautions="Avoid in excessively dry skin or severe eczema."
    )
    th8 = Therapy(
        name="Pizhichil",
        code="PAN-PIZ",
        description="The royal 'Thailadhara' procedure where streams of warm medicated oil are continuously poured and massaged by synchronized attendants.",
        default_duration_minutes=75,
        indicative_price=3800.0,
        required_room_type="Therapy & Steam Chamber",
        required_therapist_skills="Pizhichil",
        preparation_instructions="Requires 3 to 4 liters of warm medicated taila (Dhanwantharam / Bala). 2 therapists work in unison.",
        precautions="Monitor body temperature to prevent chills. Gentle warm shower post procedure."
    )
    db.add_all([th1, th2, th3, th4, th5, th6, th7, th8])
    db.commit()

    # 6. Patients
    p1 = Patient(
        patient_id="AYUR-2026-0001",
        full_name="Meenakshi Sundaram",
        date_of_birth="1982-04-15",
        age=44,
        gender="Female",
        phone="+91 94471 23456",
        email="meenakshi.s@gmail.com",
        address="Flat 4B, Riverfront Gardens, Aluva, Kochi, Kerala",
        emergency_contact="Sundaram (Husband): +91 94471 23457",
        blood_group="B+",
        prakriti="Vata-Pitta",
        allergies="Shellfish, mild dust sensitivity",
        medical_history="Chronic Cervical Spondylosis with radiating left arm tingling, sleep onset insomnia for 6 months.",
        assigned_doctor_id=doc1.id,
        status="In Treatment"
    )
    p2 = Patient(
        patient_id="AYUR-2026-0002",
        full_name="Aditya Nambiar",
        date_of_birth="1975-09-22",
        age=50,
        gender="Male",
        phone="+91 94472 34567",
        email="aditya.nambiar@corp.in",
        address="House 12, Palm Meadows, Kakkanad, Kochi, Kerala",
        emergency_contact="Radha (Wife): +91 94472 34568",
        blood_group="O+",
        prakriti="Pitta-Kapha",
        allergies="Sulfa drugs",
        medical_history="Mild fatty liver, elevated uric acid (Vatarakta symptoms), morning heel stiffness.",
        assigned_doctor_id=doc2.id,
        status="Active"
    )
    p3 = Patient(
        patient_id="AYUR-2026-0003",
        full_name="Lakshmi Narayanan",
        date_of_birth="1968-12-05",
        age=57,
        gender="Female",
        phone="+91 94473 45678",
        email="lakshmi.n@outlook.com",
        address="22 Temple View Road, Tripunithura, Kerala",
        emergency_contact="Gopal (Son): +91 94473 45679",
        blood_group="A+",
        prakriti="Vata",
        allergies="No known drug or herbal allergies",
        medical_history="Bilateral knee osteoarthritis (Janu Sandhivata), restricted mobility on climbing stairs.",
        assigned_doctor_id=doc1.id,
        status="In Treatment"
    )
    p4 = Patient(
        patient_id="AYUR-2026-0004",
        full_name="Devanathan Pillai",
        date_of_birth="1990-01-30",
        age=36,
        gender="Male",
        phone="+91 94474 56789",
        email="devan.pillai@techstart.io",
        address="108 Technopark Avenue, Kazhakkoottam, Thiruvananthapuram",
        emergency_contact="Anupama: +91 94474 56780",
        blood_group="AB+",
        prakriti="Kapha-Vata",
        allergies="None documented",
        medical_history="Lumbar muscle spasm (Katishoola) aggravated by prolonged desk work.",
        assigned_doctor_id=doc1.id,
        status="Active"
    )
    p5 = Patient(
        patient_id="AYUR-2026-0005",
        full_name="Arundhati Iyer",
        date_of_birth="1988-07-19",
        age=37,
        gender="Female",
        phone="+91 94475 67890",
        email="arundhati.iyer@gmail.com",
        address="Shanti Nagar, Fort Kochi, Kerala",
        emergency_contact="Ramesh: +91 94475 67891",
        blood_group="O+",
        prakriti="Pitta",
        allergies="Penicillin",
        medical_history="Chronic migraine (Suryavarta) and acidity (Amlapitta).",
        assigned_doctor_id=doc2.id,
        status="In Treatment"
    )
    db.add_all([p1, p2, p3, p4, p5])
    db.commit()

    # 7. Appointments (Today, Tomorrow, and Past)
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    tomorrow_str = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
    yesterday_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

    apt1 = Appointment(
        appointment_number="APT-2026-0001",
        patient_id=p1.id,
        doctor_id=doc1.id,
        therapist_id=t1.id,
        therapy_id=th2.id, # Shirodhara
        room_id=r1.id, # Dhara chamber
        date=today_str,
        start_time="09:00",
        end_time="10:00",
        duration_minutes=60,
        status=AppointmentStatus.CONFIRMED.value,
        notes="Day 3 of Shirodhara regimen for insomnia. Maintain warm oil temperature."
    )
    apt2 = Appointment(
        appointment_number="APT-2026-0002",
        patient_id=p3.id,
        doctor_id=doc1.id,
        therapist_id=t2.id,
        therapy_id=th1.id, # Abhyanga
        room_id=r2.id, # Abhyanga suite
        date=today_str,
        start_time="10:30",
        end_time="11:30",
        duration_minutes=60,
        status=AppointmentStatus.SCHEDULED.value,
        notes="Bilateral knee focus with Mahanarayana Taila and mild Bashpa Sweda."
    )
    apt3 = Appointment(
        appointment_number="APT-2026-0003",
        patient_id=p5.id,
        doctor_id=doc2.id,
        therapist_id=t3.id,
        therapy_id=th6.id, # Nasya
        room_id=r2.id, # Abhyanga suite
        date=today_str,
        start_time="14:00",
        end_time="14:45",
        duration_minutes=45,
        status=AppointmentStatus.SCHEDULED.value,
        notes="Anu Thailam administration for migraine prevention."
    )
    apt4 = Appointment(
        appointment_number="APT-2026-0004",
        patient_id=p2.id,
        doctor_id=doc2.id,
        therapist_id=t4.id,
        therapy_id=th7.id, # Udvartana
        room_id=r2.id,
        date=tomorrow_str,
        start_time="09:30",
        end_time="10:30",
        duration_minutes=60,
        status=AppointmentStatus.SCHEDULED.value,
        notes="Kolakulathadi Churna deep scrubbing."
    )
    apt5 = Appointment(
        appointment_number="APT-2026-0005",
        patient_id=p4.id,
        doctor_id=doc1.id,
        therapist_id=t1.id,
        therapy_id=th8.id, # Pizhichil
        room_id=r4.id,
        date=tomorrow_str,
        start_time="11:00",
        end_time="12:15",
        duration_minutes=75,
        status=AppointmentStatus.SCHEDULED.value,
        notes="Warm medicated oil stream for lumbar spasm."
    )
    apt6 = Appointment(
        appointment_number="APT-2026-0006",
        patient_id=p1.id,
        doctor_id=doc1.id,
        therapist_id=t1.id,
        therapy_id=th2.id,
        room_id=r1.id,
        date=yesterday_str,
        start_time="09:00",
        end_time="10:00",
        duration_minutes=60,
        status=AppointmentStatus.COMPLETED.value,
        notes="Day 2 completed. Patient reported deep relaxation and improved sleep."
    )
    db.add_all([apt1, apt2, apt3, apt4, apt5, apt6])
    db.commit()

    # 8. Treatment Plans & Progress Tracking
    plan1 = TreatmentPlan(
        plan_number="PLAN-2026-0001",
        patient_id=p1.id,
        doctor_id=doc1.id,
        diagnosis="Cervical Spondylosis (Manya Stambha) with Anidra (Insomnia)",
        primary_dosha="Vata",
        goal="Relieve radiating cervical tension, soothe nervous system, restore restorative natural sleep rhythm.",
        total_sessions=7,
        completed_sessions=3,
        start_date=yesterday_str,
        end_date=(datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d"),
        status="Active",
        special_instructions="Apply warm Ksheerabala Thailam on scalp. No exposure to AC directly after therapy."
    )
    plan2 = TreatmentPlan(
        plan_number="PLAN-2026-0002",
        patient_id=p3.id,
        doctor_id=doc1.id,
        diagnosis="Janu Sandhivata (Osteoarthritis of Knees)",
        primary_dosha="Vata-Kapha",
        goal="Reduce joint stiffness, alleviate pain, restore knee range of motion via Patra Pinda Sweda and Abhyanga.",
        total_sessions=10,
        completed_sessions=4,
        start_date=(datetime.utcnow() - timedelta(days=4)).strftime("%Y-%m-%d"),
        end_date=(datetime.utcnow() + timedelta(days=6)).strftime("%Y-%m-%d"),
        status="Active",
        special_instructions="Gentle knee rotation only. Do not perform high resistance flexion."
    )
    db.add_all([plan1, plan2])
    db.commit()

    # Treatment Sessions
    sess1 = TreatmentSession(
        treatment_plan_id=plan1.id,
        appointment_id=apt6.id,
        patient_id=p1.id,
        therapist_id=t1.id,
        therapy_id=th2.id,
        session_number=2,
        session_date=yesterday_str,
        attendance="Present",
        vitals="BP: 122/78 mmHg, Pulse: 68 bpm, Weight: 58 kg",
        therapist_notes="Maintained uniform stream of warm Ksheerabala 101. Patient slept soundly during session.",
        doctor_observations="Decreased hypertonicity in trapezius. Patient looks visibly calmer.",
        patient_feedback="Fell asleep within 15 minutes. Neck feeling much lighter.",
        pain_score_before=6,
        pain_score_after=3
    )
    db.add(sess1)
    db.commit()

    # 9. Digital Prescriptions
    rx1 = Prescription(
        prescription_number="RX-2026-0001",
        patient_id=p1.id,
        doctor_id=doc1.id,
        consultation_date=today_str,
        diagnosis="Manya Stambha (Cervical Spondylosis) & Anidra",
        general_advice="Avoid soft spongy pillows. Apply warm water fomentation before sleep. Avoid dry, cold foods.",
        follow_up_date=(datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d")
    )
    db.add(rx1)
    db.flush()

    rx_items = [
        PrescriptionItem(
            prescription_id=rx1.id,
            medicine_name="Maharasnadi Kwatham",
            dosage_form="Kwatha (Decoction)",
            dosage="15 ml diluted with 45 ml warm boiled water",
            timing="Before Meals",
            frequency="Twice daily (Morning & Evening)",
            duration_days=14,
            instructions="Drink warm at 7 AM and 7 PM."
        ),
        PrescriptionItem(
            prescription_id=rx1.id,
            medicine_name="Ksheerabala 101 Avarthi Capsules",
            dosage_form="Soft Gelatin Capsule",
            dosage="2 capsules with warm milk",
            timing="Bedtime",
            frequency="Once daily",
            duration_days=14,
            instructions="Take 30 minutes before sleep."
        ),
        PrescriptionItem(
            prescription_id=rx1.id,
            medicine_name="Dhanwantharam Thailam (Warm Application)",
            dosage_form="Taila (Oil)",
            dosage="10 ml applied gently on cervical region",
            timing="Before Bath",
            frequency="Once daily",
            duration_days=14,
            instructions="Leave for 20 minutes before mild warm water wash."
        )
    ]
    db.add_all(rx_items)
    db.commit()

    # 10. Diet Plans
    diet1 = DietPlan(
        plan_number="DIET-2026-0001",
        patient_id=p1.id,
        doctor_id=doc1.id,
        title="Vata Shamaka & Dhatu Poshan Diet Protocol",
        dosha_focus="Vata Pacifying",
        start_date=today_str,
        end_date=(datetime.utcnow() + timedelta(days=14)).strftime("%Y-%m-%d"),
        pathya_foods="Warm basmati rice, moong dal soup with cumin and pure cow ghee, steamed zucchini, sweet ripe fruits (papaya, soaked dates, pomegranates), warm spiced milk.",
        apathya_foods="Raw salads, cold iced beverages, cabbage, cauliflower, rajma, deep-fried snacks, fermented bakery bread.",
        breakfast_plan="Warm ragi porridge or idli with mild coconut coriander chutney. Cup of ginger cardamom infusion.",
        lunch_plan="Steamed red rice (Matta rice), yellow moong dal with ghee, snake gourd (padavalanga) thoran, fresh buttermilk seasoned with ginger.",
        dinner_plan="Light vegetable soup with barley or broken wheat khichdi by 7:30 PM. Warm milk with nutmeg at bedtime.",
        herbal_teas_water="Boil 1 liter drinking water with 1 tsp jeera and 1 pinch shunthi (dry ginger). Drink lukewarm throughout day.",
        general_rules="Never skip breakfast. Dine at least 2.5 hours before bedtime. Avoid screen time during meals."
    )
    db.add(diet1)
    db.commit()

    # 11. Invoices & Payments
    inv1 = Invoice(
        invoice_number="INV-2026-0001",
        patient_id=p1.id,
        appointment_id=apt1.id,
        invoice_date=today_str,
        due_date=(datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d"),
        subtotal=3100.0,
        discount=100.0,
        tax_amount=150.0,
        total_amount=3150.0,
        paid_amount=3150.0,
        payment_status="Paid",
        payment_method="UPI",
        notes="Paid via GPay UPI transaction ref #GP98471201."
    )
    db.add(inv1)
    db.flush()

    inv_items1 = [
        InvoiceItem(
            invoice_id=inv1.id,
            description="Shirodhara Session (Ksheerabala)",
            item_type="Therapy",
            quantity=1,
            unit_price=2500.0,
            total_price=2500.0
        ),
        InvoiceItem(
            invoice_id=inv1.id,
            description="Specialist Clinical Consultation (Dr. Rajesh Krishnan)",
            item_type="Consultation",
            quantity=1,
            unit_price=600.0,
            total_price=600.0
        )
    ]
    db.add_all(inv_items1)

    inv2 = Invoice(
        invoice_number="INV-2026-0002",
        patient_id=p3.id,
        appointment_id=apt2.id,
        invoice_date=today_str,
        due_date=(datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d"),
        subtotal=1800.0,
        discount=0.0,
        tax_amount=90.0,
        total_amount=1890.0,
        paid_amount=0.0,
        payment_status="Pending",
        payment_method="UPI",
        notes="Pending insurance reimbursement / cash counter payment."
    )
    db.add(inv2)
    db.flush()

    inv_items2 = [
        InvoiceItem(
            invoice_id=inv2.id,
            description="Abhyanga Full Body Therapy with Herbal Steam",
            item_type="Therapy",
            quantity=1,
            unit_price=1800.0,
            total_price=1800.0
        )
    ]
    db.add_all(inv_items2)
    db.commit()

    # 12. Inventory Items
    inv_items = [
        InventoryItem(
            item_code="OIL-001",
            name="Ksheerabala Thailam (101 Avarthi)",
            category="Herbal Oil",
            batch_number="KB101-2026-B1",
            stock_quantity=850.0,
            unit="ml",
            reorder_threshold=500.0,
            purchase_price=920.0,
            selling_price=1250.0,
            expiry_date=(datetime.utcnow() + timedelta(days=365)).strftime("%Y-%m-%d"),
            supplier_name="Kottakkal Arya Vaidya Sala",
            location="Pharmacy Shelf A-1"
        ),
        InventoryItem(
            item_code="OIL-002",
            name="Mahanarayana Thailam",
            category="Herbal Oil",
            batch_number="MN-2026-C4",
            stock_quantity=450.0, # Below reorder threshold!
            unit="ml",
            reorder_threshold=600.0,
            purchase_price=480.0,
            selling_price=690.0,
            expiry_date=(datetime.utcnow() + timedelta(days=280)).strftime("%Y-%m-%d"),
            supplier_name="Vaidyaratnam Oushadhasala",
            location="Pharmacy Shelf A-2"
        ),
        InventoryItem(
            item_code="OIL-003",
            name="Dhanwantharam Thailam",
            category="Herbal Oil",
            batch_number="DH-2026-A9",
            stock_quantity=2400.0,
            unit="ml",
            reorder_threshold=1000.0,
            purchase_price=650.0,
            selling_price=890.0,
            expiry_date=(datetime.utcnow() + timedelta(days=400)).strftime("%Y-%m-%d"),
            supplier_name="Kottakkal Arya Vaidya Sala",
            location="Bulk Oil Storage Room"
        ),
        InventoryItem(
            item_code="CHU-001",
            name="Kolakulathadi Churnam",
            category="Churnam",
            batch_number="KKC-2025-V2",
            stock_quantity=180.0, # Below reorder threshold!
            unit="grams",
            reorder_threshold=300.0,
            purchase_price=140.0,
            selling_price=220.0,
            expiry_date=(datetime.utcnow() + timedelta(days=45)).strftime("%Y-%m-%d"), # Near expiry!
            supplier_name="Kerala Ayurveda Ltd",
            location="Powder Cabinet B-3"
        ),
        InventoryItem(
            item_code="KWA-001",
            name="Maharasnadi Kwatham Tablets",
            category="Kwatham",
            batch_number="MRK-2026-12",
            stock_quantity=45.0,
            unit="bottles",
            reorder_threshold=15.0,
            purchase_price=180.0,
            selling_price=260.0,
            expiry_date=(datetime.utcnow() + timedelta(days=600)).strftime("%Y-%m-%d"),
            supplier_name="Kottakkal Arya Vaidya Sala",
            location="Tablets Rack C-1"
        ),
        InventoryItem(
            item_code="CON-001",
            name="Sterilized Cotton Droni Towels (Heavy Terry)",
            category="Consumable",
            batch_number="TOW-2026-BATCH",
            stock_quantity=8.0, # Low stock!
            unit="pcs",
            reorder_threshold=20.0,
            purchase_price=220.0,
            selling_price=300.0,
            expiry_date="2030-12-31",
            supplier_name="Sree Balaji Textiles",
            location="Linen Wardrobe D"
        )
    ]
    db.add_all(inv_items)
    db.commit()

    # 13. Notifications
    n1 = Notification(
        title="Upcoming Therapy Session",
        message="Shirodhara for Meenakshi Sundaram scheduled today at 09:00 in Dhara Chamber.",
        notification_type="appointment",
        severity="info",
        link="/appointments"
    )
    n2 = Notification(
        title="Low Inventory Alert",
        message="Mahanarayana Thailam is down to 450 ml (threshold: 600 ml). Reorder advised.",
        notification_type="inventory",
        severity="warning",
        link="/inventory"
    )
    n3 = Notification(
        title="Near Expiry Batch Alert",
        message="Kolakulathadi Churnam Batch KKC-2025-V2 expires in 45 days. Use priority stock.",
        notification_type="inventory",
        severity="danger",
        link="/inventory"
    )
    n4 = Notification(
        title="Pending Invoice",
        message="Invoice #INV-2026-0002 for Lakshmi Narayanan (INR 1,890) awaits counter settlement.",
        notification_type="billing",
        severity="warning",
        link="/billing"
    )
    db.add_all([n1, n2, n3, n4])
    db.commit()

    db.close()
    print("AyurSutra demonstration data seeded successfully!")

if __name__ == "__main__":
    seed_database()
