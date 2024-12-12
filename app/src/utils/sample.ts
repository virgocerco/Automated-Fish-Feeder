// Sample script to ensure database structure is created correctly
import { rtdb } from './firebaseConfig';
import { ref, set } from 'firebase/database';

export const initializeSampleData = async () => {
    try {
        const sampleRef = ref(rtdb, 'SAMPLE');

        await set(sampleRef, {
            message: 'This is a sample collection',
            createdAt: new Date().toISOString(),
        });

        console.log('✅ Sample collection created successfully');
    } catch (error) {
        console.error('❌ Error creating sample collection:', error);
    }
};

// Import this function in your Dashboard component and invoke it
// testFunction(); // Call this function in your test or component logic
